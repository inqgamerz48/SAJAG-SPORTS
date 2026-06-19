import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReversePickup } from '@/lib/shiprocket'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'
import { z } from 'zod'

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  razorpay_order_id: z.string().min(1, 'razorpay_order_id is required'),
  razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required'),
  razorpay_signature: z.string().min(1, 'razorpay_signature is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = verifyPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const { orderId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = parsed.data

    const signatureOk = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })
    if (!signatureOk) {
      return NextResponse.json({ success: false, error: 'Invalid Razorpay signature' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true, orderItems: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ success: false, error: 'Razorpay order mismatch' }, { status: 400 })
    }

    const validReverseShipment = order.shipments.find(
      (shipment: any) =>
        shipment.provider === 'shiprocket' &&
        shipment.isReverse &&
        Boolean(shipment.awbCode || shipment.shiprocketOrderId)
    )
    if (validReverseShipment) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: 'Payment already verified and pickup already created.',
      })
    }

    const incompleteReverseShipments = order.shipments.filter(
      (shipment: any) =>
        shipment.provider === 'shiprocket' &&
        shipment.isReverse &&
        !shipment.awbCode &&
        !shipment.shiprocketOrderId
    )
    if (incompleteReverseShipments.length > 0) {
      await prisma.$transaction([
        prisma.shipment.deleteMany({
          where: {
            id: { in: incompleteReverseShipments.map((shipment) => shipment.id) },
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: {
            reversePickupBookedAt: null,
            status: 'Pending',
            paymentStatus: 'paid',
          },
        }),
      ])
    }

    const lockResult = await prisma.order.updateMany({
      where: {
        id: order.id,
        OR: [
          { reversePickupBookedAt: null },
          { status: 'Manual_Fulfillment_Required' },
        ],
      },
      data: {
        reversePickupBookedAt: new Date(),
        paymentStatus: 'paid',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
    })

    if (lockResult.count === 0) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: 'Payment accepted. Pickup creation already initiated.',
      })
    }

    const isAllStringing = order.orderItems && order.orderItems.length > 0 && order.orderItems.every(
      (item) => item.serviceType === 'stringing'
    )

    if (isAllStringing) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'In_Workshop',
          paymentStatus: 'fully_paid',
        },
      })

      // Fire orderConfirmed notification
      const customerName = order.customerName || 'Customer'
      const customerPhone = order.customerPhone || ''
      if (!customerPhone) {
        throw new Error('Customer phone number is missing. Cannot book pickup.')
      }
      const email = order.customerEmail || null
      const confirmedTemplate = templates.orderConfirmed(order.id, customerName)
      if (email) {
        sendEmailNotification({
          to: email,
          subject: confirmedTemplate.subject,
          text: confirmedTemplate.text
        }).catch(err => console.error('Failed to send orderConfirmed email', err))
      }
      if (customerPhone) {
        sendSMSNotification(customerPhone, confirmedTemplate.sms).catch(err => console.error('Failed to send orderConfirmed SMS', err))
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        manualShippingRequired: false,
        message: 'Payment verified. Local Pune stringing order assigned directly to workshop.',
      })
    }

    const amount = Number(order.finalQuote ?? order.logisticsDeposit ?? 0)
    const customerName = order.customerName || 'Customer'
    const customerPhone = order.customerPhone || ''
    if (!customerPhone) {
      throw new Error('Customer phone number is missing. Cannot book pickup.')
    }
    const customerAddress = order.addressLine1 || 'Address not provided'
    const customerPincode = order.pincode || ''
    const customerCity = order.city || 'Unknown'
    const customerState = order.state || 'Unknown'
    const email = order.customerEmail || null;

    // Fire orderConfirmed
    const confirmedTemplate = templates.orderConfirmed(order.id, customerName);
    if (email) {
      sendEmailNotification({
        to: email,
        subject: confirmedTemplate.subject,
        text: confirmedTemplate.text
      }).catch(err => console.error('Failed to send orderConfirmed email', err));
    }
    if (customerPhone) {
      sendSMSNotification(customerPhone, confirmedTemplate.sms).catch(err => console.error('Failed to send orderConfirmed SMS', err));
    }

    try {
      const shiprocketResult = await createReversePickup({
        orderId: order.id,
        customerName,
        customerPhone,
        customerAddress,
        customerPincode,
        customerCity,
        customerState,
        amount,
      })

      if (!shiprocketResult.success) {
        if (shiprocketResult.isValidationError) {
          console.error('[Verify Payment] Validation failure before Shiprocket call for order:', order.id, shiprocketResult.error)

          await prisma.order.update({
            where: { id: order.id },
            data: {
              reversePickupBookedAt: null,
              paymentStatus: 'paid',
            },
          })

          const adminTemplate = templates.validationFailedAdminAlert(
            order.id,
            customerName,
            shiprocketResult.error || 'Validation failed for customer details'
          )
          sendEmailNotification({
            to: process.env.ADMIN_EMAIL || 'admin@sajagsports.com',
            subject: adminTemplate.subject,
            text: adminTemplate.text,
          }).catch(err => console.error('Failed to send admin validation failure alert email', err))

          return NextResponse.json({
            success: true,
            orderId: order.id,
            manualShippingRequired: false,
            message: 'Payment received successfully. However, we noticed an issue with your address or phone number. Our team will verify and resolve this to arrange your pickup.',
          })
        }

        throw new Error(shiprocketResult.error || 'Shiprocket reverse pickup failed')
      }

      const targetStatus = shiprocketResult.pickupScheduled ? 'Pickup_Pending' : 'Return_Created';
      const targetShipmentStatus = shiprocketResult.pickupScheduled ? 'Pickup_Scheduled' : 'Return_Created';

      await prisma.$transaction([
        prisma.shipment.create({
          data: {
            orderId: order.id,
            awbCode: shiprocketResult.waybill || null,
            shiprocketOrderId: shiprocketResult.shiprocketOrderId || null,
            shipmentStatus: targetShipmentStatus,
            isReverse: true,
            provider: 'shiprocket',
            courierName: shiprocketResult.courierName || null,
            courierRate: shiprocketResult.courierRate ?? null,
            courierRating: shiprocketResult.courierRating ?? null,
            isFallback: shiprocketResult.isFallback ?? false,
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: targetStatus as any,
            paymentStatus: 'fully_paid',
          },
        }),
      ])

      const awb = shiprocketResult.waybill || shiprocketResult.shiprocketOrderId || 'Pending';
      const pickupTemplate = templates.pickupScheduled(order.id, awb, customerName);
      if (email) {
        sendEmailNotification({
          to: email,
          subject: pickupTemplate.subject,
          text: pickupTemplate.text
        }).catch(err => console.error('Failed to send pickupScheduled email', err));
      }
      if (customerPhone) {
        sendSMSNotification(customerPhone, pickupTemplate.sms).catch(err => console.error('Failed to send pickupScheduled SMS', err));
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        manualShippingRequired: false,
      })
    } catch (shiprocketError: any) {
      console.error('Shiprocket reverse pickup failed for order:', order.id, shiprocketError)

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'Manual_Fulfillment_Required',
          paymentStatus: 'paid_manual_shipping_required',
          // Allow safe retry once Shiprocket config is fixed.
          reversePickupBookedAt: null,
        },
      })

      // Dispatch failure emails to customer and admin
      const failureTemplate = templates.pickupFailedCustomer(order.id)
      const adminTemplate = templates.pickupFailedAdminAlert(
        order.id,
        customerName,
        shiprocketError.message || 'Shiprocket API rejected return creation'
      )

      if (email) {
        sendEmailNotification({
          to: email,
          subject: failureTemplate.subject,
          text: failureTemplate.text
        }).catch(err => console.error('Failed to send customer pickupFailed email', err))
      }
      sendEmailNotification({
        to: process.env.ADMIN_EMAIL || 'admin@sajagsports.com',
        subject: adminTemplate.subject,
        text: adminTemplate.text
      }).catch(err => console.error('Failed to send admin alert email', err))

      if (customerPhone) {
        sendSMSNotification(customerPhone, failureTemplate.sms).catch(err => console.error('Failed to send customer pickupFailed SMS', err))
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        manualShippingRequired: true,
        message: 'Payment successful. Our team will arrange pickup manually.',
      })
    }
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Payment verification failed', 
      reason: 'An unexpected internal error occurred during payment verification.' 
    }, { status: 500 })
  }
}
