import { NextRequest, NextResponse } from 'next/server'
import { verifyPayUResponseHash } from '@/lib/payu'
import { createAdminClient } from '@/lib/supabase/admin'
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

        const supabase = createAdminClient()

        if (status === 'success') {
            // Update order status to Pickup_Pending (payment confirmed)
            const { data: order, error: updateError } = await supabase
                .from('orders')
                .update({ status: 'Pickup_Pending', updated_at: new Date().toISOString() })
                .eq('id', order_id)
                .select(`
                    *,
                    profiles (full_name, email, phone, address, pincode)
                `)
                .single()

            if (updateError) {
                console.error('Error updating order:', updateError)
            }

            if (order) {
                const profile = order.profiles as any

                // If it's a repair service, auto-book Delhivery reverse pickup
                if (order.service_type === 'Frame Repair' && profile?.pincode) {
                    try {
                        // Extract city/state from address or use defaults
                        const addressParts = (profile.address || '').split(',').map((s: string) => s.trim())
                        const city = addressParts[addressParts.length - 2] || 'Unknown'
                        const state = addressParts[addressParts.length - 1] || 'Unknown'

                        const pickupResult = await createReversePickup({
                            order_id: order.id,
                            customer_name: profile.full_name,
                            customer_email: profile.email,
                            customer_phone: profile.phone,
                            customer_address: profile.address,
                            customer_pincode: profile.pincode,
                            customer_city: city,
                            customer_state: state,
                        })

                        if (pickupResult.success) {
                            await supabase.from('shipments').insert({
                                order_id: order.id,
                                waybill: pickupResult.waybill,
                                pickup_id: pickupResult.pickup_id,
                                delhivery_order_id: pickupResult.delhivery_order_id,
                                shipment_status: 'Pickup_Scheduled',
                                is_reverse: true,
                                provider: 'delhivery',
                            })
                        } else {
                            console.error('Delhivery auto-booking failed:', pickupResult.error)
                        }
                    } catch (delhiveryError) {
                        console.error('Delhivery auto-booking error:', delhiveryError)
                    }
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
