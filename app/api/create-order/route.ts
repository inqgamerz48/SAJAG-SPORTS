import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPincodeServiceability } from '@/lib/delhivery'

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
        if (!serviceability || !serviceability.serviceable) {
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

        // 4. Shiprocket Reverse Pickup logic was removed here temporarily as the functions do not exist in lib/shiprocket.ts
        // A dedicated shipment syncing mechanism can be set up via the Admin backend.

        return NextResponse.json({ success: true, order_id: order.id })

    } catch (error: any) {
        console.error('Create Order Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
