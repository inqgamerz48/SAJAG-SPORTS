import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReversePickup } from '@/lib/shiprocket'
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'

type RetryPayload = {
  orderId?: string
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as RetryPayload
    const orderId = body.orderId?.trim()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
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
        message: 'Reverse pickup already exists for this order.',
        awbCode: validReverseShipment.awbCode,
        shiprocketOrderId: validReverseShipment.shiprocketOrderId,
      })
    }

    // Clear stale reverse shipment rows created by previous failed attempts.
    const incompleteReverseShipmentIds = order.shipments
      .filter(
        (shipment: any) =>
          shipment.provider === 'shiprocket' &&
          shipment.isReverse &&
          !shipment.awbCode &&
          !shipment.shiprocketOrderId
      )
      .map((shipment: any) => shipment.id)

    await prisma.$transaction([
      prisma.shipment.deleteMany({
        where: { id: { in: incompleteReverseShipmentIds } },
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

    const amount = Number(order.finalQuote ?? order.logisticsDeposit ?? 0)
    const customerName = order.customerName || 'Customer'
    const customerPhone = order.customerPhone || '9999999999'
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
    })

    if (!shiprocketResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'Manual_Fulfillment_Required',
          paymentStatus: 'paid_manual_shipping_required',
          reversePickupBookedAt: null,
        },
      })
      return NextResponse.json(
        {
          success: false,
          orderId: order.id,
          error: shiprocketResult.error || 'Shiprocket rejected reverse pickup creation',
        },
        { status: 502 }
      )
    }

    await prisma.$transaction([
      prisma.shipment.create({
        data: {
          orderId: order.id,
          awbCode: shiprocketResult.waybill || null,
          shiprocketOrderId: shiprocketResult.shiprocketOrderId || null,
          shipmentStatus: 'Pickup_Scheduled',
          isReverse: true,
          provider: 'shiprocket',
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'Pickup_Pending',
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
