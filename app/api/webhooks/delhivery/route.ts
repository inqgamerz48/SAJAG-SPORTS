import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Delhivery Webhook Handler
 * 
 * Delhivery sends POST requests to this endpoint when shipment status changes.
 * Configure this URL in Delhivery Dashboard → Settings → Webhooks.
 * 
 * Webhook URL: https://your-domain.com/api/webhooks/delhivery
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json()

        // Delhivery webhook payload structure:
        // { waybill: string, status: string, status_code: string, ... }
        const {
            waybill,
            status,
            status_code,
            expected_delivery_date,
        } = payload

        if (!waybill) {
            return NextResponse.json({ error: 'Missing waybill' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Find and update the shipment record
        const { data: shipment, error: findError } = await supabase
            .from('shipments')
            .select('*')
            .eq('waybill', waybill)
            .single()

        if (findError || !shipment) {
            console.warn('Webhook: Shipment not found for waybill:', waybill)
            return NextResponse.json({ message: 'Shipment not found, ignoring' }, { status: 200 })
        }

        // 2. Update shipment status
        await supabase
            .from('shipments')
            .update({
                shipment_status: status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shipment.id)

        // 3. Map Delhivery status to our order status and update
        const statusMapping: Record<string, string> = {
            'Delivered': shipment.is_reverse ? 'In_Workshop' : 'Completed',
            'Out For Delivery': shipment.is_reverse ? 'In_Workshop' : 'Ready_to_Return',
            'In Transit': 'Pickup_Pending',
            'Picked Up': 'Pickup_Pending',
            'Pending': 'Pickup_Pending',
        }

        const newOrderStatus = statusMapping[status]
        if (newOrderStatus) {
            await supabase
                .from('orders')
                .update({ status: newOrderStatus, updated_at: new Date().toISOString() })
                .eq('id', shipment.order_id)
        }

        console.log(`Delhivery webhook processed: Waybill ${waybill}, Status: ${status}`)
        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Delhivery webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
