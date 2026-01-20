import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    // Skip if Razorpay not configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { event, payload } = body

    // Verify webhook signature (implement based on Razorpay webhook verification)
    // For now, we'll process the payment

    if (event === 'payment.captured') {
      const { order_id, payment_id } = payload.payment.entity

      const supabase = await createClient()

      // Update order with payment information
      await supabase
        .from('orders')
        .update({
          razorpay_payment_id: payment_id,
          payment_status: 'deposit_paid',
        })
        .eq('razorpay_order_id', order_id)

      return NextResponse.json({ success: true })
    }

    if (event === 'payment.failed') {
      // Handle failed payment
      return NextResponse.json({ success: false, error: 'Payment failed' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
