import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReversePickup } from '@/lib/delhivery'

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
      (shipment) =>
        shipment.provider === 'delhivery' &&
        shipment.isReverse &&
        Boolean(shipment.awbCode || shipment.delhiveryOrderId)
    )
    if (validReverseShipment) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: 'Reverse pickup already exists for this order.',
        awbCode: validReverseShipment.awbCode,
        delhiveryOrderId: validReverseShipment.delhiveryOrderId,
      })
    }

    // Clear stale reverse shipment rows created by previous failed attempts.
    const incompleteReverseShipmentIds = order.shipments
      .filter(
        (shipment) =>
          shipment.provider === 'delhivery' &&
          shipment.isReverse &&
          !shipment.awbCode &&
          !shipment.delhiveryOrderId
      )
      .map((shipment) => shipment.id)

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
          error: delhiveryResult.error || 'Delhivery rejected reverse pickup creation',
        },
        { status: 502 }
      )
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
          reversePickupBookedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Reverse pickup created successfully.',
      awbCode: delhiveryResult.waybill || null,
      delhiveryOrderId: delhiveryResult.delhiveryOrderId || null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Retry reverse pickup failed'
    console.error('Retry reverse pickup error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
