import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createForwardShipment } from '@/lib/delhivery'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Admin: Trigger return shipment (Workshop → Customer)
 * Called when admin clicks "Ship Back" on a repaired order.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { order_id } = await req.json()

        if (!order_id) {
            return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 })
        }

        // 1. Get order + customer details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
        *,
        profiles (full_name, email, phone, address, pincode)
      `)
            .eq('id', order_id)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
        }

        const profile = order.profiles as any

        // Extract city/state from address
        const addressParts = (profile.address || '').split(',').map((s: string) => s.trim())
        const city = addressParts[addressParts.length - 2] || 'Unknown'
        const state = addressParts[addressParts.length - 1] || 'Unknown'

        // 2. Create forward shipment via Delhivery
        const delhiveryResult = await createForwardShipment({
            order_id: order.id,
            customer_name: profile.full_name,
            customer_email: profile.email,
            customer_phone: profile.phone,
            customer_address: profile.address,
            customer_pincode: profile.pincode,
            customer_city: city,
            customer_state: state,
        })

        if (delhiveryResult.success) {
            // 3. Save forward shipment record
            await supabase.from('shipments').insert({
                order_id: order.id,
                waybill: delhiveryResult.waybill,
                delhivery_order_id: delhiveryResult.delhivery_order_id,
                shipment_status: 'Manifested',
                is_reverse: false, // This is a forward shipment
                provider: 'delhivery',
            })

            // 4. Update order status
            await supabase
                .from('orders')
                .update({ status: 'Ready_to_Return', updated_at: new Date().toISOString() })
                .eq('id', order_id)

            return NextResponse.json({
                success: true,
                waybill: delhiveryResult.waybill,
            })
        } else {
            return NextResponse.json({
                success: false,
                error: delhiveryResult.error || 'Failed to create return shipment',
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error('Trigger Return Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
