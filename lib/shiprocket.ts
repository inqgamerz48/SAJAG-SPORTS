// Shiprocket Integration for Sajag Sports (Noida Workshop)

const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1'
const WORKSHOP_PINCODE = '201301' // Noida Workshop Pincode
const WORKSHOP_ADDRESS = 'Sajag Sports Workshop, Noida, Sec-15, UP'
const WORKSHOP_CITY = 'Noida'
const WORKSHOP_STATE = 'Uttar Pradesh'
const WORKSHOP_PHONE = '9876543210' // Placeholder

import { createClient } from './supabase/server'

/**
 * Fetch and cache the Bearer Token (valid for 10 days)
 */
async function getShiprocketToken(): Promise<string> {
  const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL
  const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials not configured')
  }

  const supabase = await createClient()

  // 1. Try to get token from Supabase cache
  const { data: config } = await supabase
    .from('shiprocket_config')
    .select('*')
    .eq('id', 'current_token')
    .single()

  if (config && new Date(config.expires_at) > new Date(Date.now() + 30 * 60 * 1000)) {
    return config.token
  }

  // 2. Fetch new token
  const authResponse = await fetch(`${SHIPROCKET_API_URL}/external/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  })

  if (!authResponse.ok) {
    throw new Error('Shiprocket authentication failed')
  }

  const authData = await authResponse.json()
  const token = authData.token
  const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()

  // 3. Update Supabase cache
  await supabase
    .from('shiprocket_config')
    .upsert({ id: 'current_token', token, expires_at: expiresAt })

  return token
}

/**
 * Check pincode serviceability
 */
export async function checkPincodeServiceability(pincode: string) {
  try {
    const token = await getShiprocketToken()
    const queryParams = new URLSearchParams({
      pickup_postcode: pincode,
      delivery_postcode: WORKSHOP_PINCODE,
      weight: '2.0',
      cod: '0',
    })

    const response = await fetch(`${SHIPROCKET_API_URL}/external/courier/serviceability/?${queryParams.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Pincode Serviceability Error:', error)
    return { status: 404, message: 'Serviceability check failed' }
  }
}

/**
 * Create Reverse Order (Customer to Workshop)
 */
export async function createReverseOrder(orderData: {
  order_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  customer_pincode: string
  customer_city: string
  customer_state: string
}) {
  try {
    const token = await getShiprocketToken()

    // Dimensions for Size 1 Badminton Box: 69 x 25 x 5 cm
    // Weight: 2.0 kg (Billable Volumetric Weight)
    const payload = {
      order_id: orderData.order_id,
      order_date: new Date().toISOString().split('T')[0],
      pickup_customer_name: orderData.customer_name,
      pickup_customer_email: orderData.customer_email,
      pickup_phone: orderData.customer_phone,
      pickup_address: orderData.customer_address,
      pickup_city: orderData.customer_city,
      pickup_state: orderData.customer_state,
      pickup_pincode: orderData.customer_pincode,
      pickup_country: 'India',

      delivery_customer_name: 'Sajag Sports Workshop',
      delivery_phone: WORKSHOP_PHONE,
      delivery_address: WORKSHOP_ADDRESS,
      delivery_city: WORKSHOP_CITY,
      delivery_state: WORKSHOP_STATE,
      delivery_pincode: WORKSHOP_PINCODE,
      delivery_country: 'India',

      order_items: [
        {
          name: 'Badminton Racquet (Repair)',
          sku: 'RACQUET-REPAIR',
          units: 1,
          selling_price: 500,
        },
      ],
      payment_method: 'Prepaid',
      sub_invoice_number: orderData.order_id,
      length: 69,
      breadth: 25,
      height: 5,
      weight: 2.0,
      fragile_shipment: true,
    }

    const response = await fetch(`${SHIPROCKET_API_URL}/external/orders/create/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Create Reverse Order Error:', error)
    throw error
  }
}


/**
 * Create Forward Order (Workshop back to Customer)
 */
export async function createForwardOrder(orderData: {
  order_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  customer_pincode: string
  customer_city: string
  customer_state: string
}) {
  try {
    const token = await getShiprocketToken()

    const payload = {
      order_id: `FWD-${orderData.order_id}`,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: 'Primary',

      billing_customer_name: orderData.customer_name,
      billing_last_name: '',
      billing_address: orderData.customer_address,
      billing_city: orderData.customer_city,
      billing_pincode: orderData.customer_pincode,
      billing_state: orderData.customer_state,
      billing_country: 'India',
      billing_email: orderData.customer_email,
      billing_phone: orderData.customer_phone,

      shipping_is_billing: true,

      order_items: [
        {
          name: 'Repaired Badminton Racquet',
          sku: 'RACQUET-RETURN',
          units: 1,
          selling_price: 500,
        },
      ],
      payment_method: 'Prepaid',
      sub_total: 500,
      length: 69,
      breadth: 25,
      height: 5,
      weight: 2.0,
      fragile_shipment: true,
    }

    const response = await fetch(`${SHIPROCKET_API_URL}/external/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Create Forward Order Error:', error)
    throw error
  }
}

/**
 * Hyperlocal Flow for Noida-to-Noida
 */
export async function checkHyperlocalServiceability(pincode: string) {
  // If both pincodes are Noida (starting with 201), prioritize hyperlocal
  if (pincode.startsWith('201') && WORKSHOP_PINCODE.startsWith('201')) {
    try {
      const token = await getShiprocketToken()
      // Hyperlocal specific parameters might be needed here
      // For now, we use the standard serviceability and look for hyperlocal partners
      const data = await checkPincodeServiceability(pincode)
      return data
    } catch (error) {
      console.error('Hyperlocal Serviceability Error:', error)
      return null
    }
  }
  return null
}
/**
 * Calculate round-trip shipping cost
 */
export async function calculateRoundTripShipping(pincode: string) {
  try {
    const data = await checkPincodeServiceability(pincode)

    if (data.status === 404 || !data.data?.available_courier_companies?.length) {
      return { error: 'Location not serviceable' }
    }

    const cheapestCourier = data.data.available_courier_companies[0]
    const legA = cheapestCourier.rate
    const legB = cheapestCourier.rate // Assuming same rate for return leg for estimation

    return {
      legA,
      legB,
      total: legA + legB,
      etd: cheapestCourier.etd
    }
  } catch (error) {
    console.error('Round trip calculation error:', error)
    return { error: 'Failed to calculate shipping' }
  }
}
