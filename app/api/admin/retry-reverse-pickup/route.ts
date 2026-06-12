import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReversePickup, cancelShiprocketOrder } from '@/lib/shiprocket'
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'
import { z } from 'zod'

const retryReversePickupSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
})

// In-memory retry counter per order (resets on server restart)
const retryCountMap = new Map<string, number>()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = retryReversePickupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const { orderId } = parsed.data

    // Increment retry counter
    const currentCount = (retryCountMap.get(orderId) || 0) + 1
    retryCountMap.set(orderId, currentCount)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found', retryCount: currentCount }, { status: 404 })
    }

    // ── Step 1: Cancel ALL existing reverse Shiprocket orders ──
    const existingReverseShipments = order.shipments.filter(
      (shipment: any) =>
        shipment.provider === 'shiprocket' &&
        shipment.isReverse
    )

    for (const shipment of existingReverseShipments) {
      if ((shipment as any).shiprocketOrderId) {
        console.log(`[Admin Retry #${currentCount}] Cancelling old Shiprocket order ${(shipment as any).shiprocketOrderId} for order ${order.id}`)
        const cancelResult = await cancelShiprocketOrder((shipment as any).shiprocketOrderId)
        if (!cancelResult.success) {
          console.warn(`[Admin Retry #${currentCount}] Cancel returned non-success (continuing anyway):`, cancelResult.error)
        }
      }
    }

    // ── Step 2: Clean up ALL reverse shipment rows + reset order state ──
    const reverseShipmentIds = existingReverseShipments.map((s: any) => s.id)

    await prisma.$transaction([
      prisma.shipment.deleteMany({
        where: { id: { in: reverseShipmentIds } },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          reversePickupBookedAt: null,
          paymentStatus:
            order.paymentStatus === 'pending'
              ? 'paid'
              : order.paymentStatus,
        },
      }),
    ])

    // ── Step 3: Create a completely fresh return order with unique suffix ──
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

    const shiprocketResult = await createReversePickup({
      orderId: order.id,
      customerName,
      customerPhone,
      customerAddress,
      customerPincode,
      customerCity,
      customerState,
      amount,
    }, Date.now().toString())

    if (!shiprocketResult.success) {
      if (shiprocketResult.isValidationError) {
        console.error(`[Admin Retry #${currentCount}] Validation failure for order:`, order.id, shiprocketResult.error)
        return NextResponse.json(
          {
            success: false,
            orderId: order.id,
            error: `Validation error: ${shiprocketResult.error}. Please correct the customer details.`,
            retryCount: currentCount,
          },
          { status: 400 }
        )
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'Manual_Fulfillment_Required',
          paymentStatus: 'paid_manual_shipping_required',
          reversePickupBookedAt: null,
        },
      })

      // Dispatch failure emails/SMS
      const failureTemplate = templates.pickupFailedCustomer(order.id)
      const adminTemplate = templates.pickupFailedAdminAlert(
        order.id,
        customerName,
        shiprocketResult.error || 'Shiprocket API rejected return creation during retry'
      )
      const email = order.customerEmail || null

      if (email) {
        sendEmailNotification({
          to: email,
          subject: failureTemplate.subject,
          text: failureTemplate.text
        }).catch(err => console.error('Failed to send customer pickupFailed email during retry', err))
      }
      sendEmailNotification({
        to: process.env.ADMIN_EMAIL || 'admin@sajagsports.com',
        subject: adminTemplate.subject,
        text: adminTemplate.text
      }).catch(err => console.error('Failed to send admin alert email during retry', err))

      if (customerPhone) {
        sendSMSNotification(customerPhone, failureTemplate.sms).catch(err => console.error('Failed to send customer pickupFailed SMS during retry', err))
      }

      return NextResponse.json(
        {
          success: false,
          orderId: order.id,
          error: shiprocketResult.error || 'Shiprocket rejected reverse pickup creation',
          retryCount: currentCount,
        },
        { status: 502 }
      )
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
          reversePickupBookedAt: new Date(),
        },
      }),
    ])

    const awb = shiprocketResult.waybill || shiprocketResult.shiprocketOrderId || 'Pending';
    const pickupTemplate = templates.pickupScheduled(order.id, awb);
    const email = order.customerEmail || null;
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
      message: 'Reverse pickup created successfully.',
      awbCode: shiprocketResult.waybill || null,
      shiprocketOrderId: shiprocketResult.shiprocketOrderId || null,
      retryCount: currentCount,
    })
  } catch (error) {
    console.error('Retry reverse pickup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Retry reverse pickup failed', 
      reason: 'An unexpected internal error occurred while retrying the reverse pickup creation.' 
    }, { status: 500 })
  }
}
