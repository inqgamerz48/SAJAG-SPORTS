import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/orders - List all orders (uses service role, bypasses RLS).
 * GET /api/admin/orders?id=xxx - Get single order + media (for admin detail).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (orderId) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const { data: media } = await supabase
        .from('media_evidence')
        .select('*')
        .eq('order_id', orderId)

      return NextResponse.json({ order, media: media || [] })
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin orders fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(orders || [])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin API error'
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Admin not configured. Add SUPABASE_SERVICE_ROLE_KEY to env.' },
        { status: 503 }
      )
    }
    console.error('Admin orders API error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
