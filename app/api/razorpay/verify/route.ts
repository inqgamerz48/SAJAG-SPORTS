import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReversePickup } from '@/lib/delhivery'

/**
 * Verify Razorpay Payment and Trigger Delhivery Manifestation
 * 
 * POST /api/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_id,
        } = body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { success: false, error: 'Missing payment details' },
                { status: 400 }
            )
        }

        // Verify Razorpay signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET!
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (generatedSignature !== razorpay_signature) {
            console.error('Invalid Razorpay signature')
            return NextResponse.json(
                { success: false, error: 'Payment verification failed' },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        // Update order payment status
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .update({
                payment_status: 'completed',
                razorpay_order_id,
                razorpay_payment_id,
                status: 'Pickup_Requested',
                updated_at: new Date().toISOString(),
            })
            .eq('id', order_id)
            .select(`
        *,
        profiles (full_name, email, phone, address, pincode)
      `)
            .single()

        if (orderError || !order) {
            console.error('Order update error:', orderError)
            return NextResponse.json(
                { success: false, error: 'Failed to update order' },
                { status: 500 }
            )
        }

        const profile = order.profiles as any

        // Trigger Delhivery reverse pickup for repair orders
        if (order.service_type === 'Frame Repair' && profile?.pincode) {
            try {
                // Extract city/state from address
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
                    // Save shipment record
                    await supabase.from('shipments').insert({
                        order_id: order.id,
                        waybill: pickupResult.waybill,
                        pickup_id: pickupResult.pickup_id,
                        delhivery_order_id: pickupResult.delhivery_order_id,
                        shipment_status: 'Pickup_Scheduled',
                        is_reverse: true,
                        provider: 'delhivery',
                    })

                    console.log('Delhivery pickup scheduled:', pickupResult.waybill)
                } else {
                    console.error('Delhivery pickup failed:', pickupResult.error)
                    // Don't fail the payment, just log the error
                }
            } catch (delhiveryError) {
                console.error('Delhivery error:', delhiveryError)
                // Don't fail the payment
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            order_id: order.id,
        })
    } catch (error: any) {
        console.error('Razorpay verify error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Verification failed' },
            { status: 500 }
        )
    }
}
