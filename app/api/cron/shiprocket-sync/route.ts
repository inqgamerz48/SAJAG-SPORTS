import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReversePickup, createForwardShipment } from '@/lib/shiprocket'
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  // 1. Authenticate the cron request
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
  if (!cronSecret) {
    console.error('[Cron] No CRON_SECRET or NEXTAUTH_SECRET configured — rejecting request')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Fetch pending shipments where courier scheduling failed initially
    const pendingShipments = await prisma.shipment.findMany({
      where: {
        shipmentStatus: {
          in: ['Return_Created', 'Manifested']
        }
      },
      include: { order: true }
    })

    console.log(`[Shiprocket Cron Sync] Found ${pendingShipments.length} pending shipments to schedule.`)
    let processedCount = 0

    for (const shipment of pendingShipments) {
      const order = shipment.order
      if (!order) continue

      // Extract customer details and addresses
      const profile = await prisma.profile.findUnique({
        where: { id: order.customerId || '' }
      })

      const address = order.addressLine1 || profile?.address || 'Address not provided'
      const pincode = order.pincode || profile?.pincode || ''
      const phone = order.customerPhone || profile?.phone || ''
      if (!phone) {
        throw new Error('Customer phone number is missing. Cannot book pickup.')
      }
      const name = order.customerName || profile?.fullName || 'Customer'

      const addressParts = (address || '').split(',').map((s: string) => s.trim())
      const city = order.city || addressParts[addressParts.length - 2] || 'Unknown'
      const state = order.state || addressParts[addressParts.length - 1] || 'Unknown'
      const email = order.customerEmail || profile?.email || 'customer@sajagsports.com'

      if (shipment.isReverse) {
        // Retry reverse logistics allocation
        console.log(`[Shiprocket Cron Sync] Retrying reverse pickup for order ${order.id}...`)
        const result = await createReversePickup({
          orderId: order.id,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          customerPincode: pincode,
          customerCity: city,
          customerState: state,
          amount: Number(order.finalQuote || order.logisticsDeposit || 0)
        })

        if (result.success && result.pickupScheduled) {
          const [updatedShipment] = await prisma.$transaction([
            prisma.shipment.update({
              where: { id: shipment.id },
              data: {
                awbCode: result.waybill || null,
                shiprocketOrderId: result.shiprocketOrderId || null,
                shipmentStatus: 'Pickup_Scheduled',
                courierName: result.courierName || null,
                courierRate: result.courierRate ?? null,
                courierRating: result.courierRating ?? null,
                isFallback: result.isFallback ?? false,
              }
            }),
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'Pickup_Pending' }
            })
          ])
          processedCount++
          console.log(`[Shiprocket Cron Sync] Successfully scheduled reverse pickup for order ${order.id}.`)

          const pickupTemplate = templates.pickupScheduled(order.id, updatedShipment.awbCode || 'Pending')
          const customerEmail = order.customerEmail || profile?.email
          const customerPhone = order.customerPhone || profile?.phone
          if (customerEmail) {
            sendEmailNotification({ to: customerEmail, subject: pickupTemplate.subject, text: pickupTemplate.text }).catch(err => console.error('Cron pickup email failed', err))
          }
          if (customerPhone) {
            sendSMSNotification(customerPhone, pickupTemplate.sms).catch(err => console.error('Cron pickup SMS failed', err))
          }
        }
      } else {
        // Retry forward logistics allocation
        console.log(`[Shiprocket Cron Sync] Retrying forward shipment for order ${order.id}...`)
        const result = await createForwardShipment({
          order_id: order.id,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          customer_address: address,
          customer_pincode: pincode,
          customer_city: city,
          customer_state: state
        })

        if (result.success && result.pickupScheduled) {
          const [updatedShipment] = await prisma.$transaction([
            prisma.shipment.update({
              where: { id: shipment.id },
              data: {
                awbCode: result.waybill || null,
                shiprocketOrderId: result.shiprocketOrderId || null,
                shipmentStatus: 'Shipped',
                courierName: result.courierName || null,
                courierRate: result.courierRate ?? null,
                courierRating: result.courierRating ?? null,
                isFallback: result.isFallback ?? false,
              }
            }),
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'Shipped' }
            })
          ])
          processedCount++
          console.log(`[Shiprocket Cron Sync] Successfully scheduled forward shipment for order ${order.id}.`)

          const shipTemplate = templates.shipmentShipped(order.id, updatedShipment.awbCode || 'Pending')
          const customerEmail = order.customerEmail || profile?.email
          const customerPhone = order.customerPhone || profile?.phone
          if (customerEmail) {
            sendEmailNotification({ to: customerEmail, subject: shipTemplate.subject, text: shipTemplate.text }).catch(err => console.error('Cron shipment email failed', err))
          }
          if (customerPhone) {
            sendSMSNotification(customerPhone, shipTemplate.sms).catch(err => console.error('Cron shipment SMS failed', err))
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })
  } catch (error: any) {
    console.error('[Shiprocket Cron Sync Error]:', error)
    return NextResponse.json({ error: 'Cron execution failed', details: error.message }, { status: 500 })
  }
}
