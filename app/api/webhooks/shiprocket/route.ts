import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'

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

import { z } from 'zod'

const shiprocketWebhookSchema = z.object({
  awb_code: z.any().optional(),
  awb: z.any().optional(),
  waybill: z.any().optional(),
  current_status: z.any().optional(),
  status: z.any().optional(),
  shipment_status_label: z.any().optional(),
  tracking_data: z.object({
    awb_code: z.any().optional(),
    awb: z.any().optional(),
    waybill: z.any().optional(),
    current_status: z.any().optional(),
    status: z.any().optional(),
    shipment_status_label: z.any().optional(),
  }).optional(),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the webhook request
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN || process.env.NEXTAUTH_SECRET
    if (!expectedToken) {
      console.error('[Shiprocket Webhook] No SHIPROCKET_WEBHOOK_TOKEN or NEXTAUTH_SECRET configured — rejecting request')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }
    const authHeader = req.headers.get('x-api-key') || req.headers.get('authorization')
    if (authHeader !== expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.warn('[Shiprocket Webhook] Unauthorized request - key mismatch or missing')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawPayload = await req.json()
    const parsed = shiprocketWebhookSchema.safeParse(rawPayload)
    if (!parsed.success) {
      console.warn('[Shiprocket Webhook] Invalid webhook payload format')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const payload = parsed.data
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
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
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

    const previousOrderStatus = shipment.order?.status

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

    // 5. Trigger notifications on status transitions
    if (targetOrderStatus && targetOrderStatus !== previousOrderStatus) {
      const order = shipment.order
      const profile = order.customer
      const name = order.customerName || profile?.fullName || 'Customer'
      const email = order.customerEmail || profile?.email
      const phone = order.customerPhone || profile?.phone

      if (targetOrderStatus === 'In_Workshop') {
        const arrivedTemplate = templates.arrivedAtWorkshop(order.id, name)
        if (email) {
          sendEmailNotification({ to: email, subject: arrivedTemplate.subject, text: arrivedTemplate.text, html: arrivedTemplate.html }).catch(err => console.error('Webhook In_Workshop email failed', err))
        }
        if (phone) {
          sendSMSNotification(phone, arrivedTemplate.sms).catch(err => console.error('Webhook In_Workshop SMS failed', err))
        }
      } else if (targetOrderStatus === 'Completed') {
        const completedTemplate = templates.orderCompleted(order.id, name)
        if (email) {
          sendEmailNotification({ to: email, subject: completedTemplate.subject, text: completedTemplate.text, html: completedTemplate.html }).catch(err => console.error('Webhook Completed email failed', err))
        }
        if (phone) {
          sendSMSNotification(phone, completedTemplate.sms).catch(err => console.error('Webhook Completed SMS failed', err))
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Shiprocket Webhook Error]:', error)
    return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 })
  }
}
