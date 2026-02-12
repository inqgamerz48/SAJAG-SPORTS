import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Supabase client with service role to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { orderId, phone } = await request.json()

        if (!orderId || !phone) {
            return NextResponse.json(
                { success: false, error: 'Order ID and phone number are required' },
                { status: 400 }
            )
        }

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

        // Query order with matching ID and phone
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                id, 
                service_type, 
                status, 
                created_at,
                profiles (full_name, phone),
                racquet_specs (brand, model),
                shipments (awb_code)
            `)
            .eq('id', orderId)
            .single()

        if (error || !order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            )
        }

        const customerPhone = (order.profiles as any)?.phone || ''
        const cleanOrderPhone = customerPhone.replace(/[\s\-\(\)]/g, '')

        // Verify phone number matches (compare last 10 digits)
        if (phone !== 'PAYMENT_FLOW') {
            const orderPhoneLast10 = cleanOrderPhone.slice(-10)
            const inputPhoneLast10 = cleanPhone.slice(-10)

            if (orderPhoneLast10 !== inputPhoneLast10) {
                return NextResponse.json(
                    { success: false, error: 'Phone number does not match order records' },
                    { status: 403 }
                )
            }
        }

        // Return order details
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                service_type: order.service_type,
                status: order.status,
                created_at: order.created_at,
                customer_name: (order.profiles as any)?.full_name,
                racquet_brand: (order.racquet_specs as any)?.brand,
                racquet_model: (order.racquet_specs as any)?.model,
                shiprocket_awb_code: (order.shipments as any)?.[0]?.awb_code,
            },
        })
    } catch (error) {
        console.error('Track order error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
