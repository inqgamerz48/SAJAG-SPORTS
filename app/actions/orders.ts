'use server'

import { createClient } from '@/lib/supabase/server'
import { createReversePickup } from '@/lib/shiprocket'
import { revalidatePath } from 'next/cache'
import { sendEmailNotification, sendSMSNotification, templates } from '@/lib/notifications'

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

  // Defensive check: Prevent double approvals/duplicate emails
  if (order.status !== 'Pending') {
    return { success: false, error: 'Order has already been approved or processed' }
  }

  const profile = order.profiles as any

  if (order.service_type === 'Frame Repair' && profile?.pincode) {
    // Create reverse pickup via Shiprocket
    try {
      // Extract city/state from address
      const addressParts = (profile.address || '').split(',').map((s: string) => s.trim())
      const city = addressParts[addressParts.length - 2] || 'Unknown'
      const state = addressParts[addressParts.length - 1] || 'Unknown'

      const customerPhone = profile.phone || ''
      if (!customerPhone) {
        throw new Error('Customer phone number is missing. Cannot book pickup.')
      }

      const pickupResult = await createReversePickup({
        orderId: order.id,
        customerName: profile.full_name || 'Customer',
        customerPhone: customerPhone,
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
          shipment_status: pickupResult.pickupScheduled ? 'Pickup_Scheduled' : 'Return_Created',
          is_reverse: true,
          provider: 'shiprocket',
        })

        await supabase
          .from('orders')
          .update({ status: pickupResult.pickupScheduled ? 'Pickup_Pending' : 'Return_Created' })
          .eq('id', orderId)

        // Notify customer on status transitions
        const email = profile.email || null
        const customerName = profile.full_name || 'Customer'

        if (pickupResult.pickupScheduled) {
          const awb = pickupResult.waybill || pickupResult.shiprocketOrderId || 'Pending'
          const pickupTemplate = templates.pickupScheduled(order.id, awb, customerName)
          if (email) {
            sendEmailNotification({
              to: email,
              subject: pickupTemplate.subject,
              text: pickupTemplate.text,
              html: pickupTemplate.html
            }).catch(err => console.error('Failed to send pickupScheduled email in approveOrder', err))
          }
          if (customerPhone) {
            sendSMSNotification(customerPhone, pickupTemplate.sms).catch(err => console.error('Failed to send pickupScheduled SMS in approveOrder', err))
          }
        } else {
          const failureTemplate = templates.pickupFailedCustomer(order.id, customerName)
          if (email) {
            sendEmailNotification({
              to: email,
              subject: failureTemplate.subject,
              text: failureTemplate.text,
              html: failureTemplate.html
            }).catch(err => console.error('Failed to send customer pickupFailed email in approveOrder', err))
          }
          if (customerPhone) {
            sendSMSNotification(customerPhone, failureTemplate.sms).catch(err => console.error('Failed to send customer pickupFailed SMS in approveOrder', err))
          }
        }

        revalidatePath('/admin/dashboard')
        return { success: true }
      } else {
        // Fallback to manual logistics handling on creation failure
        await supabase
          .from('orders')
          .update({ status: 'Manual_Fulfillment_Required' })
          .eq('id', orderId)

        const customerName = profile.full_name || 'Customer'
        const email = profile.email || null
        const failureTemplate = templates.pickupFailedCustomer(order.id, customerName)
        if (email) {
          sendEmailNotification({
            to: email,
            subject: failureTemplate.subject,
            text: failureTemplate.text,
            html: failureTemplate.html
          }).catch(err => console.error('Failed to send customer pickupFailed email on error in approveOrder', err))
        }
        if (customerPhone) {
          sendSMSNotification(customerPhone, failureTemplate.sms).catch(err => console.error('Failed to send customer pickupFailed SMS on error in approveOrder', err))
        }

        return { success: false, error: pickupResult.error || 'Failed to create Shiprocket pickup' }
      }
    } catch (err: any) {
      // Fallback on unexpected exceptions
      await supabase
        .from('orders')
        .update({ status: 'Manual_Fulfillment_Required' })
        .eq('id', orderId)

      const customerName = profile?.full_name || 'Customer'
      const email = profile?.email || null
      const failureTemplate = templates.pickupFailedCustomer(order.id, customerName)
      if (email) {
        sendEmailNotification({
          to: email,
          subject: failureTemplate.subject,
          text: failureTemplate.text,
          html: failureTemplate.html
        }).catch(err => console.error('Failed to send customer pickupFailed email on exception in approveOrder', err))
      }
      if (profile?.phone) {
        sendSMSNotification(profile.phone, failureTemplate.sms).catch(err => console.error('Failed to send customer pickupFailed SMS on exception in approveOrder', err))
      }

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
