import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReversePickup } from '@/lib/delhivery'
import { verifyRazorpaySignature } from '@/lib/razorpay'

type VerifyPaymentPayload = {
  orderId?: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyPaymentPayload
    const orderId = body.orderId?.trim()
    const razorpayOrderId = body.razorpay_order_id?.trim()
    const razorpayPaymentId = body.razorpay_payment_id?.trim()
    const razorpaySignature = body.razorpay_signature?.trim()

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Missing payment verification fields' }, { status: 400 })
    }

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
      include: { shipments: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ success: false, error: 'Razorpay order mismatch' }, { status: 400 })
    }

    const validReverseShipment = order.shipments.find(
      (shipment) =>
        shipment.provider === 'delhivery' &&
        shipment.isReverse &&
        Boolean(shipment.awbCode || shipment.delhiveryOrderId)
    )
    if (validReverseShipment) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: 'Payment already verified and pickup already created.',
      })
    }

    const incompleteReverseShipments = order.shipments.filter(
      (shipment) =>
        shipment.provider === 'delhivery' &&
        shipment.isReverse &&
        !shipment.awbCode &&
        !shipment.delhiveryOrderId
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

    const amount = Number(order.finalQuote ?? order.logisticsDeposit ?? 0)
    const customerName = order.customerName || 'Customer'
    const customerPhone = order.customerPhone || '9999999999'
    const customerAddress = order.addressLine1 || 'Address not provided'
    const customerPincode = order.pincode || ''
    const customerCity = order.city || 'Unknown'
    const customerState = order.state || 'Unknown'

    try {
      const delhiveryResult = await createReversePickup({
        orderId: order.id,
        customerName,
        customerPhone,
        customerAddress,
        customerPincode,
        customerCity,
        customerState,
        amount,
      })

      if (!delhiveryResult.success) {
        throw new Error(delhiveryResult.error || 'Delhivery reverse pickup failed')
      }

      await prisma.$transaction([
        prisma.shipment.create({
          data: {
            orderId: order.id,
            awbCode: delhiveryResult.waybill || null,
            delhiveryOrderId: delhiveryResult.delhiveryOrderId || null,
            shipmentStatus: 'Pickup_Scheduled',
            isReverse: true,
            provider: 'delhivery',
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'Pickup_Pending',
            paymentStatus: 'fully_paid',
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        orderId: order.id,
        manualShippingRequired: false,
      })
    } catch (delhiveryError) {
      const safeError =
        delhiveryError instanceof Error ? delhiveryError.message : 'Unknown Delhivery error'

      console.error('Delhivery reverse pickup failed', {
        orderId: order.id,
        error: safeError,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'Manual_Fulfillment_Required',
          paymentStatus: 'paid_manual_shipping_required',
          // Allow safe retry once Delhivery config is fixed.
          reversePickupBookedAt: null,
        },
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        manualShippingRequired: true,
        message: 'Payment successful. Our team will arrange pickup manually.',
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    console.error('Verify payment error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
