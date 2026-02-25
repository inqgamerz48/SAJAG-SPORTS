import { NextRequest, NextResponse } from 'next/server'
import { verifyPayUResponseHash } from '@/lib/payu'
import { prisma } from '@/lib/prisma'
import { createReversePickup } from '@/lib/delhivery'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const data: Record<string, string> = {}
        formData.forEach((value, key) => {
            data[key] = value.toString()
        })

        const salt = process.env.PAYU_MERCHANT_SALT
        if (!salt) {
            return NextResponse.json({ error: 'PayU salt not configured' }, { status: 500 })
        }

        // Verify hash
        const isValid = verifyPayUResponseHash(data, salt)

        if (!isValid) {
            console.error('Invalid PayU hash')
            return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/book/failure?reason=hash_mismatch`)
        }

        const { status, txnid, mihpayid, amount, email, firstname, udf1: order_id } = data

        if (status === 'success') {
            // Update order status via Prisma to secure complex nested relations
            const order = await prisma.order.update({
                where: { id: order_id },
                data: {
                    status: 'Pickup_Pending',
                    paymentStatus: 'success'
                },
                include: {
                    customer: true,
                    orderItems: true
                }
            })

            const profile = order.customer

            // If ANY item in the order is a service (repair or stringing), book a Delhivery reverse pickup
            const hasService = order.orderItems.some(item => !!item.serviceType)

            if (hasService && profile?.pincode) {
                try {
                    // Extract city/state from address or use defaults
                    const addressParts = (profile.address || '').split(',').map((s: string) => s.trim())
                    const state = addressParts.length > 1 ? addressParts[addressParts.length - 1] : 'Unknown'
                    const city = addressParts.length > 2 ? addressParts[addressParts.length - 2] : 'Unknown'

                    const pickupResult = await createReversePickup({
                        order_id: order.id,
                        customer_name: profile.fullName || 'Customer',
                        customer_email: profile.email,
                        customer_phone: profile.phone || '',
                        customer_address: profile.address || '',
                        customer_pincode: profile.pincode,
                        customer_city: city,
                        customer_state: state,
                    })

                    if (pickupResult.success) {
                        await prisma.shipment.create({
                            data: {
                                orderId: order.id,
                                awbCode: pickupResult.waybill,
                                provider: 'delhivery',
                                isReverse: true,
                                shipmentStatus: 'Pickup_Scheduled'
                            }
                        })
                    } else {
                        console.error('Delhivery auto-booking failed:', pickupResult.error)
                    }
                } catch (delhiveryError) {
                    console.error('Delhivery auto-booking error:', delhiveryError)
                }
            }

            // Redirect to success page
            return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/book/success?order_id=${order_id}`)
        } else {
            // Payment failed — leave order as-is
            console.warn(`PayU payment failed for order ${order_id}: status=${status}`)

            return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/book/failure?order_id=${order_id}&status=${status}`)
        }
    } catch (error) {
        console.error('PayU callback error:', error)
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/book/failure?reason=internal_error`)
    }
}
