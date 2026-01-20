import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/razorpay'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Skip if Razorpay not configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 })
    }

    const { payment_id, order_id, signature } = await request.json()

    const isValid = await verifyPayment(payment_id, order_id, signature)

    if (isValid) {
      const supabase = await createClient()

      // Find order by razorpay_order_id
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('razorpay_order_id', order_id)
        .single()

      if (order) {
        // Update order payment status
        await supabase
          .from('orders')
          .update({
            razorpay_payment_id: payment_id,
            payment_status: 'deposit_paid',
          })
          .eq('id', order.id)
      }

      return NextResponse.json({ success: true, verified: true })
    }

    return NextResponse.json({ success: false, verified: false }, { status: 400 })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
