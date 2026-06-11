import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Map Shiprocket tracking status labels to OrderStatus enum values
const REVERSE_ORDER_STATUS_MAP: Record<string, string> = {
  'PICKED UP': 'In_Workshop',
  'PICKED-UP': 'In_Workshop',
  'IN TRANSIT': 'In_Workshop',
  'IN-TRANSIT': 'In_Workshop',
  'OUT FOR PICKUP': 'Pickup_Pending',
  'OUT-FOR-PICKUP': 'Pickup_Pending',
  'DELIVERED': 'In_Workshop', // For reverse leg, delivery means arrived at workshop
}

const FORWARD_ORDER_STATUS_MAP: Record<string, string> = {
  'PICKED UP': 'Shipped',
  'PICKED-UP': 'Shipped',
  'IN TRANSIT': 'Shipped',
  'IN-TRANSIT': 'Shipped',
  'DELIVERED': 'Completed', // For forward leg, delivered to customer
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the webhook request
    const authHeader = req.headers.get('x-api-key') || req.headers.get('authorization')
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN || process.env.NEXTAUTH_SECRET

    // Allow flexible matching if keys are configured
    if (expectedToken && authHeader) {
      const cleanHeader = authHeader.replace(/bearer\s+/i, '').trim()
      if (cleanHeader !== expectedToken.trim()) {
        console.warn('[Shiprocket Webhook] Unauthorized request key mismatch')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const payload = await req.json()
    console.log('[Shiprocket Webhook Received Payload]:', JSON.stringify(payload, null, 2))

    const trackingData = payload.tracking_data || payload
    const awb = trackingData.awb_code || trackingData.awb || trackingData.waybill
    const currentStatus = trackingData.current_status || trackingData.status
    const statusLabel = (trackingData.shipment_status_label || currentStatus || '').toString().toUpperCase().trim()

    if (!awb) {
      console.warn('[Shiprocket Webhook] Webhook request missing tracking code/AWB')
      return NextResponse.json({ error: 'AWB not provided' }, { status: 400 })
    }

    // 2. Find matching database shipment record
    const shipment = await prisma.shipment.findFirst({
      where: { awbCode: awb.toString() },
      include: { order: true }
    })

    if (!shipment) {
      console.warn(`[Shiprocket Webhook] AWB ${awb} not found in database. Ignoring.`)
      return NextResponse.json({ received: true, message: 'AWB not found' }, { status: 200 })
    }

    // 3. Determine target order status
    const isReverse = shipment.isReverse
    let targetOrderStatus: string | null = null

    if (isReverse) {
      targetOrderStatus = REVERSE_ORDER_STATUS_MAP[statusLabel] || null
    } else {
      targetOrderStatus = FORWARD_ORDER_STATUS_MAP[statusLabel] || null
    }

    // 4. Update status in database
    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: { shipmentStatus: currentStatus }
      })

      if (targetOrderStatus) {
        console.log(`[Shiprocket Webhook] Updating order ${shipment.orderId} status to ${targetOrderStatus}`)
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: targetOrderStatus as any }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Shiprocket Webhook Error]:', error)
    return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 })
  }
}
