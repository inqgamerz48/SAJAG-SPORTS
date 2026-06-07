import crypto from 'crypto'
import Razorpay from 'razorpay'
import { getRazorpayEnv } from '@/lib/env'

let cachedRazorpayClient: Razorpay | null = null

function getRazorpayClient(): Razorpay {
  if (cachedRazorpayClient) return cachedRazorpayClient

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getRazorpayEnv()
  cachedRazorpayClient = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  })
  return cachedRazorpayClient
}

export async function createRazorpayOrder(params: {
  amountInPaise: number
  receipt: string
  notes?: Record<string, string>
}) {
  const razorpay = getRazorpayClient()
  try {
    return await razorpay.orders.create({
      amount: params.amountInPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes,
    })
  } catch (error: any) {
    console.error('[Razorpay API] createRazorpayOrder exception:', error)
    const message =
      error?.error?.description ||
      error?.message ||
      'Failed to create Razorpay order'
    throw new Error(message)
  }
}

export function verifyRazorpaySignature(input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): boolean {
  const { RAZORPAY_KEY_SECRET } = getRazorpayEnv()
  const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex')
    .trim()
  const received = (input.razorpaySignature || '').trim()

  if (!received || expected.length !== received.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}
