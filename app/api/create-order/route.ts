import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createReverseOrder, checkPincodeServiceability } from '@/lib/shiprocket'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const {
            service_type,
            brand,
            model,
            string_type,
            tension_lbs,
            knot_type,
            customer_info
        } = await req.json()

        // 1. Validate Pincode Serviceability
        const serviceability = await checkPincodeServiceability(customer_info.pincode)
        if (!serviceability || serviceability.status === 404) {
            return NextResponse.json({
                success: false,
                error: 'Pincode not serviceable for pickup.'
            }, { status: 400 })
        }

        // 2. Create Order in Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_id: user.id,
                service_type,
                status: 'Pickup_Pending'
            })
            .select()
            .single()

        if (orderError) throw orderError

        // 3. Create Racquet Specs
        const { error: specsError } = await supabase
            .from('racquet_specs')
            .insert({
                order_id: order.id,
                brand,
                model,
                string_type,
                tension_lbs,
                knot_type
            })

        if (specsError) throw specsError

        // 4. Trigger Shiprocket Reverse Pickup
        try {
            const shiprocketResult = await createReverseOrder({
                order_id: order.id,
                customer_name: customer_info.full_name,
                customer_email: user.email!,
                customer_phone: customer_info.phone,
                customer_address: customer_info.address,
                customer_pincode: customer_info.pincode,
                customer_city: customer_info.city,
                customer_state: customer_info.state
            })

            if (shiprocketResult.order_id) {
                // Update Shipment table
                await supabase.from('shipments').insert({
                    order_id: order.id,
                    shiprocket_order_id: shiprocketResult.order_id.toString(),
                    awb_code: shiprocketResult.shipment_id?.awb_code || '',
                    shipment_status: 'Pickup_Scheduled',
                    is_reverse: true
                })
            }
        } catch (shipError: any) {
            console.error('Shiprocket Error:', shipError)
            // Log to Supabase but don't stop order creation
            await supabase.from('logistics_error_logs').insert({
                order_id: order.id,
                api_endpoint: 'orders/create/return',
                error_message: shipError.message,
                error_payload: customer_info
            })
        }

        return NextResponse.json({ success: true, order_id: order.id })

    } catch (error: any) {
        console.error('Create Order Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
