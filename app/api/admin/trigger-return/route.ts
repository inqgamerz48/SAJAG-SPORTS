import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createForwardShipment } from '@/lib/shiprocket'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'

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

        const { order_id } = await req.json()

        if (!order_id) {
            return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 })
        }

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

        const profile = order.customer

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Customer profile not found for this order' }, { status: 400 })
        }

        // Extract city/state from address
        const addressParts = (profile.address || '').split(',').map((s: string) => s.trim())
        const city = addressParts[addressParts.length - 2] || 'Unknown'
        const state = addressParts[addressParts.length - 1] || 'Unknown'

        // 2. Create forward shipment via Shiprocket
        const shiprocketResult = await createForwardShipment({
            order_id: order.id,
            customer_name: profile.fullName || 'Customer',
            customer_email: profile.email,
            customer_phone: profile.phone || '9999999999',
            customer_address: profile.address || 'Address not provided',
            customer_pincode: profile.pincode || '',
            customer_city: city,
            customer_state: state,
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
            const returnTemplate = templates.shipmentShipped(order.id, shiprocketResult.waybill || 'Pending')
            if (profile.email) {
                sendEmailNotification({
                    to: profile.email,
                    subject: returnTemplate.subject,
                    text: returnTemplate.text
                }).catch(err => console.error('Failed to send shipmentShipped email', err))
            }
            if (profile.phone) {
                sendSMSNotification(profile.phone, returnTemplate.sms).catch(err => console.error('Failed to send shipmentShipped SMS', err))
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

