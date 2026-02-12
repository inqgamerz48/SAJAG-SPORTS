import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Shiprocket Webhook Handler
 * 
 * Shiprocket sends POST requests to this endpoint when shipment status changes.
 * Configure this URL in Shiprocket Dashboard → Settings → Webhooks.
 * 
 * Webhook URL: https://your-domain.com/api/webhooks/shiprocket
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json()

        // Shiprocket webhook payload structure:
        // { awb: string, current_status: string, shipment_id: number, order_id: string, ... }
        const {
            awb,
            current_status,
            current_status_id,
            order_id: shiprocketOrderId,
            etd,
        } = payload

        if (!awb && !shiprocketOrderId) {
            return NextResponse.json({ error: 'Missing AWB or Order ID' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Find and update the shipment record
        let query = supabase.from('shipments').select('*')

        if (awb) {
            query = query.eq('awb_code', awb)
        } else {
            query = query.eq('shiprocket_order_id', shiprocketOrderId.toString())
        }

        const { data: shipment, error: findError } = await query.single()

        if (findError || !shipment) {
            console.warn('Webhook: Shipment not found for AWB:', awb, 'Order:', shiprocketOrderId)
            return NextResponse.json({ message: 'Shipment not found, ignoring' }, { status: 200 })
        }

        // 2. Update shipment status
        await supabase
            .from('shipments')
            .update({
                shipment_status: current_status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shipment.id)

        // 3. Map Shiprocket status to our order status and update
        const statusMapping: Record<number, string> = {
            6: 'In_Workshop',    // Delivered (reverse pickup delivered to workshop)
            7: 'Completed',      // Delivered (forward shipment delivered to customer)
            8: 'Pickup_Pending',  // RTO - Return to Origin
            17: 'Pickup_Pending', // Pickup scheduled
            18: 'Pickup_Pending', // Out for pickup
            19: 'Pickup_Pending', // Picked up
        }

        const newOrderStatus = statusMapping[current_status_id]
        if (newOrderStatus) {
            // Only auto-update order status for specific transitions
            // For reverse (pickup) orders: Delivered → In_Workshop
            // For forward (return) orders: Delivered → Completed
            if (current_status_id === 6 && shipment.is_reverse) {
                await supabase
                    .from('orders')
                    .update({ status: 'In_Workshop', updated_at: new Date().toISOString() })
                    .eq('id', shipment.order_id)
            } else if (current_status_id === 7 && !shipment.is_reverse) {
                await supabase
                    .from('orders')
                    .update({ status: 'Completed', updated_at: new Date().toISOString() })
                    .eq('id', shipment.order_id)
            }
        }

        console.log(`Webhook processed: AWB ${awb}, Status: ${current_status} (${current_status_id})`)
        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Shiprocket webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
