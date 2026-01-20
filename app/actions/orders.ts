'use server'

import { createClient } from '@/lib/supabase/server'
import { createReversePickup } from '@/lib/shiprocket'
import { createRazorpayOrder, createPaymentLink } from '@/lib/razorpay'
import { revalidatePath } from 'next/cache'

interface CreateOrderParams {
  service_type: 'stringing' | 'repair'
  racquet_id?: string
  racquet_brand: string
  racquet_model: string
  racquet_price: number
  customer_name: string
  customer_email: string
  customer_phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  tension_lbs?: number
  string_type?: string
  crack_location?: string
  media_urls?: string[]
}

export async function createOrder(params: CreateOrderParams) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Validate high-end racquet (minimum ₹2000)
  if (params.racquet_price < 2000) {
    return {
      success: false,
      error: 'Sajag Sports specializes in professional-grade equipment. We do not service alloy/entry-level frames due to structural risks.',
    }
  }

  // Create order in database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      service_type: params.service_type,
      racquet_id: params.racquet_id || null,
      racquet_brand: params.racquet_brand,
      racquet_model: params.racquet_model,
      racquet_price: params.racquet_price,
      customer_name: params.customer_name,
      customer_email: params.customer_email,
      customer_phone: params.customer_phone,
      address_line1: params.address_line1,
      address_line2: params.address_line2 || null,
      city: params.city,
      state: params.state,
      pincode: params.pincode,
      tension_lbs: params.tension_lbs || null,
      string_type: params.string_type || null,
      crack_location: params.crack_location || null,
      logistics_deposit: params.service_type === 'repair' ? 199.00 : null,
      payment_status: params.service_type === 'repair' ? 'pending' : 'pending',
    })
    .select()
    .single()

  if (orderError || !order) {
    return { success: false, error: orderError?.message || 'Failed to create order' }
  }

  // If order was auto-rejected by trigger, return error
  if (order.status === 'rejected') {
    return {
      success: false,
      error: 'Our surgeons only operate locally for stringing. Please visit our Manjri Arena.',
    }
  }

  // Insert media evidence if provided
  if (params.media_urls && params.media_urls.length > 0) {
    const mediaRecords = params.media_urls.map((url, index) => ({
      order_id: order.id,
      media_type: params.service_type === 'repair' ? `crack_angle_${index + 1}` : 'before',
      file_url: url,
    }))

    await supabase.from('media_evidence').insert(mediaRecords)
  }

  // For repair orders, create logistics deposit payment
  let razorpayOrderId: string | undefined
  if (params.service_type === 'repair') {
    const paymentResult = await createRazorpayOrder({
      amount: 19900, // ₹199 in paise
      receipt: `deposit_${order.id}`,
      notes: {
        order_id: order.id,
        type: 'logistics_deposit',
      },
    })

    if (paymentResult.success) {
      razorpayOrderId = paymentResult.order_id
      await supabase
        .from('orders')
        .update({
          razorpay_order_id: paymentResult.order_id,
        })
        .eq('id', order.id)
    }
  }

  revalidatePath('/admin/dashboard')
  return { success: true, order_id: order.id, razorpay_order_id: razorpayOrderId }
}

export async function approveOrderForPickup(orderId: string) {
  const supabase = await createClient()

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: 'Order not found' }
  }

  if (order.service_type === 'repair' && order.logistics_mode === 'shiprocket_pan_india') {
    // Create reverse pickup via Shiprocket
    const pickupResult = await createReversePickup({
      order_id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      address_line1: order.address_line1,
      address_line2: order.address_line2 || undefined,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      order_date: new Date().toISOString().split('T')[0],
    })

    if (pickupResult.success && pickupResult.awb_code) {
      await supabase
        .from('orders')
        .update({
          status: 'approved_for_pickup',
          shiprocket_awb_code: pickupResult.awb_code,
          shiprocket_order_id: pickupResult.order_id,
        })
        .eq('id', orderId)

      revalidatePath('/admin/dashboard')
      return { success: true, awb_code: pickupResult.awb_code }
    } else {
      return { success: false, error: pickupResult.error || 'Failed to create pickup' }
    }
  }

  // For stringing (Pune local), just update status
  await supabase
    .from('orders')
    .update({ status: 'approved_for_pickup' })
    .eq('id', orderId)

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateFinalQuote(orderId: string, finalQuote: number) {
  const supabase = await createClient()

  // Get order
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  // Update final quote
  await supabase
    .from('orders')
    .update({ final_quote: finalQuote })
    .eq('id', orderId)

  // Generate payment link for remaining amount
  const remainingAmount = finalQuote - (order.logistics_deposit || 0)

  if (remainingAmount > 0) {
    const paymentLink = await createPaymentLink({
      amount: remainingAmount * 100, // Convert to paise
      order_id: orderId,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      description: `Final payment for ${order.service_type} service - Order ${orderId}`,
    })

    if (paymentLink.success) {
      // TODO: Send email/SMS with payment link
      return {
        success: true,
        payment_link: paymentLink.short_url,
        message: 'Payment link generated and sent to customer',
      }
    }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function rejectAndRefundOrder(orderId: string) {
  const supabase = await createClient()
  const { refundPayment } = await import('@/lib/razorpay')

  // Get order
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  // Refund if payment was made
  if (order.razorpay_payment_id && order.logistics_deposit) {
    await refundPayment(order.razorpay_payment_id, order.logistics_deposit)
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'rejected',
      payment_status: 'refunded',
    })
    .eq('id', orderId)

  revalidatePath('/admin/dashboard')
  return { success: true }
}
