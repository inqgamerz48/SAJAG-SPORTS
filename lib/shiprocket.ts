// Shiprocket Integration for Reverse Pickup (Pan-India Repair Service)

interface ShiprocketOrder {
  order_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  order_date: string
  pickup_location?: string
  weight?: number
}

interface ShiprocketResponse {
  success: boolean
  awb_code?: string
  order_id?: string
  shipment_id?: string
  error?: string
}

export async function createReversePickup(order: ShiprocketOrder): Promise<ShiprocketResponse> {
  const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL
  const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD
  const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1'

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials not configured')
  }

  try {
    // Step 1: Authenticate and get token
    const authResponse = await fetch(`${SHIPROCKET_API_URL}/external/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
      }),
    })

    if (!authResponse.ok) {
      throw new Error('Shiprocket authentication failed')
    }

    const authData = await authResponse.json()
    const token = authData.token

    // Step 2: Create reverse pickup order
    const pickupOrder = {
      order_id: order.order_id,
      order_date: order.order_date,
      pickup_customer_name: 'Sajag Sports',
      pickup_customer_email: 'support@sajagsports.store',
      pickup_customer_phone: process.env.SHIPROCKET_PICKUP_PHONE || '9999999999',
      pickup_address: process.env.SHIPROCKET_PICKUP_ADDRESS || 'Manjri Arena, Pune',
      pickup_city: 'Pune',
      pickup_state: 'Maharashtra',
      pickup_pincode: process.env.SHIPROCKET_PICKUP_PINCODE || '411028',
      pickup_country: 'India',
      delivery_customer_name: order.customer_name,
      delivery_customer_email: order.customer_email,
      delivery_customer_phone: order.customer_phone,
      delivery_address: order.address_line1,
      delivery_address_2: order.address_line2 || '',
      delivery_city: order.city,
      delivery_state: order.state,
      delivery_pincode: order.pincode,
      delivery_country: 'India',
      order_items: [
        {
          name: 'Badminton Racquet - Repair Service',
          sku: 'RACQUET-REPAIR',
          units: 1,
          selling_price: order.weight ? order.weight * 10 : 199,
        },
      ],
      payment_method: 'Prepaid',
      sub_invoice_number: order.order_id,
      length: 70,
      breadth: 25,
      height: 5,
      weight: order.weight || 0.2,
    }

    const orderResponse = await fetch(`${SHIPROCKET_API_URL}/external/orders/create/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pickupOrder),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      throw new Error(errorData.message || 'Failed to create reverse pickup order')
    }

    const orderData = await orderResponse.json()

    return {
      success: true,
      awb_code: orderData.shipment_id?.awb_code || orderData.awb_code,
      order_id: orderData.order_id,
      shipment_id: orderData.shipment_id?.id || orderData.shipment_id,
    }
  } catch (error) {
    console.error('Shiprocket API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function generateShippingLabel(awbCode: string): Promise<{ label_url: string } | null> {
  const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL
  const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD
  const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1'

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials not configured')
  }

  try {
    // Authenticate
    const authResponse = await fetch(`${SHIPROCKET_API_URL}/external/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
      }),
    })

    const authData = await authResponse.json()
    const token = authData.token

    // Generate label
    const labelResponse = await fetch(`${SHIPROCKET_API_URL}/external/courier/generate/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: [awbCode],
      }),
    })

    if (!labelResponse.ok) {
      throw new Error('Failed to generate shipping label')
    }

    const labelData = await labelResponse.json()
    return { label_url: labelData.label_url || labelData.url }
  } catch (error) {
    console.error('Shiprocket Label Generation Error:', error)
    return null
  }
}
