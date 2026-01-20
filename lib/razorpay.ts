// Razorpay Integration for Split Payment Logic

import Razorpay from 'razorpay'

function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

interface CreateOrderParams {
  amount: number // in paise
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  try {
    const razorpay = getRazorpayInstance()
    const order = await razorpay.orders.create({
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt || `receipt_${Date.now()}`,
      notes: params.notes || {},
    })

    return {
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    }
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function verifyPayment(paymentId: string, orderId: string, signature: string) {
  const crypto = require('crypto')
  const text = `${orderId}|${paymentId}`
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(text)
    .digest('hex')

  return generatedSignature === signature
}

export async function createPaymentLink(params: {
  amount: number
  order_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  description: string
}) {
  try {
    const razorpay = getRazorpayInstance()
    const paymentLink = await razorpay.paymentLink.create({
      amount: params.amount,
      currency: 'INR',
      description: params.description,
      customer: {
        name: params.customer_name,
        email: params.customer_email,
        contact: params.customer_phone,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        order_id: params.order_id,
      },
    })

    return {
      success: true,
      payment_link_id: paymentLink.id,
      short_url: paymentLink.short_url,
    }
  } catch (error) {
    console.error('Razorpay Payment Link Creation Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const razorpay = getRazorpayInstance()
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined, // Convert to paise
    })

    return {
      success: true,
      refund_id: refund.id,
      amount: (refund.amount || 0) / 100, // Convert back to rupees
    }
  } catch (error) {
    console.error('Razorpay Refund Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
