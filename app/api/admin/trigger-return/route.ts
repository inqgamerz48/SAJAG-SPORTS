import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createForwardShipment } from '@/lib/shiprocket'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'
import { z } from 'zod'

const triggerReturnSchema = z.object({
  order_id: z.string().uuid('Invalid order ID format'),
})

/**
 * Admin: Trigger return shipment (Workshop → Customer)
 * Called when admin clicks "Ship Back" on a repaired order.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = triggerReturnSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
        }
        const { order_id } = parsed.data

        // 1. Get order + customer details using Prisma
        const order = await prisma.order.findUnique({
            where: { id: order_id },
            include: {
                customer: true,
            }
        })

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
        }

        const rawAddress = order.addressLine1 || order.customer?.address || ''
        const addressParts = rawAddress ? rawAddress.split(',').map((s: string) => s.trim()) : []

        const customer = {
            name: order.customerName || order.customer?.fullName || 'Customer',
            email: order.customerEmail || order.customer?.email || undefined,
            phone: order.customerPhone || order.customer?.phone || '',
            address: rawAddress || 'Address not provided',
            city: order.city || addressParts[addressParts.length - 2] || 'Unknown',
            state: order.state || addressParts[addressParts.length - 1] || 'Unknown',
            pincode: order.pincode || order.customer?.pincode || '',
        }

        if (!customer.phone) {
            return NextResponse.json({ success: false, error: 'Customer phone number is missing.' }, { status: 400 })
        }

        if (!rawAddress) {
            return NextResponse.json({ success: false, error: 'Customer address is missing.' }, { status: 400 })
        }

        if (!customer.pincode) {
            return NextResponse.json({ success: false, error: 'Customer pincode is missing.' }, { status: 400 })
        }

        // 2. Create forward shipment via Shiprocket
        const shiprocketResult = await createForwardShipment({
            order_id: order.id,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            customer_address: customer.address,
            customer_pincode: customer.pincode,
            customer_city: customer.city,
            customer_state: customer.state,
        })

        if (shiprocketResult.success) {
            const targetStatus = shiprocketResult.pickupScheduled ? 'Shipped' : 'Ready_to_Return';
            const targetShipmentStatus = shiprocketResult.pickupScheduled ? 'Shipped' : 'Manifested';

            // 3. Save forward shipment record using Prisma
            await prisma.shipment.create({
                data: {
                    orderId: order.id,
                    awbCode: shiprocketResult.waybill || null,
                    shiprocketOrderId: shiprocketResult.shiprocketOrderId || null,
                    shipmentStatus: targetShipmentStatus,
                    isReverse: false, // This is a forward shipment
                    provider: 'shiprocket',
                    courierName: shiprocketResult.courierName || null,
                    courierRate: shiprocketResult.courierRate ?? null,
                    courierRating: shiprocketResult.courierRating ?? null,
                    isFallback: shiprocketResult.isFallback ?? false,
                }
            })

            // 4. Update order status using Prisma
            await prisma.order.update({
                where: { id: order_id },
                data: {
                    status: targetStatus,
                }
            })

            // 5. Notify customer of return shipment
            const returnTemplate = templates.shipmentShipped(order.id, shiprocketResult.waybill || 'Pending', customer.name)
            if (customer.email) {
                sendEmailNotification({
                    to: customer.email,
                    subject: returnTemplate.subject,
                    text: returnTemplate.text
                }).catch(err => console.error('Failed to send shipmentShipped email', err))
            }
            if (customer.phone) {
                sendSMSNotification(customer.phone, returnTemplate.sms).catch(err => console.error('Failed to send shipmentShipped SMS', err))
            }

            return NextResponse.json({
                success: true,
                waybill: shiprocketResult.waybill,
            })
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to create return shipment',
                reason: shiprocketResult.error || 'The delivery provider rejected the return shipment creation.'
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error('Trigger Return Error:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Trigger return failed', 
            reason: 'An unexpected internal error occurred while triggering the return shipment.' 
        }, { status: 500 })
    }
}

