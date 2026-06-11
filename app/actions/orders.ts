'use server'

import { createClient } from '@/lib/supabase/server'
import { createReversePickup } from '@/lib/shiprocket'
import { revalidatePath } from 'next/cache'

interface CreateOrderParams {
  service_type: 'stringing' | 'repair'
  racquet_brand: string
  racquet_model: string
  racquet_price: number
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  city: string
  state: string
  pincode: string
  tension_lbs?: number
  string_type?: string
}

export async function createOrder(params: CreateOrderParams) {
  const supabase = await createClient()

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

  // Create order (new schema)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      service_type: params.service_type === 'stringing' ? 'Stringing' : 'Frame Repair',
      status: 'Pickup_Pending',
    })
    .select()
    .single()

  if (orderError || !order) {
    return { success: false, error: orderError?.message || 'Failed to create order' }
  }

  // Create racquet specs
  await supabase.from('racquet_specs').insert({
    order_id: order.id,
    brand: params.racquet_brand,
    model: params.racquet_model,
    string_type: params.string_type || null,
    tension_lbs: params.tension_lbs || 24,
    knot_type: '4-knot',
  })

  revalidatePath('/admin/dashboard')
  return { success: true, order_id: order.id }
}

export async function approveOrderForPickup(orderId: string) {
  const supabase = await createClient()

  // Get order + customer details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      profiles (full_name, email, phone, address, pincode)
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: 'Order not found' }
  }

  const profile = order.profiles as any

  if (order.service_type === 'Frame Repair' && profile?.pincode) {
    // Create reverse pickup via Shiprocket
    try {
      // Extract city/state from address
      const addressParts = (profile.address || '').split(',').map((s: string) => s.trim())
      const city = addressParts[addressParts.length - 2] || 'Unknown'
      const state = addressParts[addressParts.length - 1] || 'Unknown'

      const pickupResult = await createReversePickup({
        orderId: order.id,
        customerName: profile.full_name || 'Customer',
        customerPhone: profile.phone || '9999999999',
        customerAddress: profile.address || 'Address not provided',
        customerPincode: profile.pincode || '',
        customerCity: city,
        customerState: state,
        amount: Number(order.final_quote ?? order.logistics_deposit ?? 0),
      })

      if (pickupResult.success) {
        // Save shipment record
        await supabase.from('shipments').insert({
          order_id: order.id,
          waybill: pickupResult.waybill,
          shiprocket_order_id: pickupResult.shiprocketOrderId,
          shipment_status: 'Return_Created',
          is_reverse: true,
          provider: 'shiprocket',
        })

        await supabase
          .from('orders')
          .update({ status: 'Return_Created' })
          .eq('id', orderId)

        revalidatePath('/admin/dashboard')
        return { success: true }
      } else {
        return { success: false, error: pickupResult.error || 'Failed to create Shiprocket pickup' }
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Shiprocket error' }
    }
  }

  // For stringing (Pune local), just update status
  await supabase
    .from('orders')
    .update({ status: 'Pickup_Pending' })
    .eq('id', orderId)

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateFinalQuote(orderId: string, finalQuote: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ final_quote: finalQuote, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    return { success: false, error: error.message }
  }

  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${orderId}`

  revalidatePath('/admin/dashboard')
  return {
    success: true,
    payment_link: paymentUrl,
    message: 'Quote updated. Payment URL generated.',
  }
}
