import { getShiprocketEnv } from '@/lib/env'

type ShiprocketCreateResult = {
  success: boolean
  waybill?: string
  shiprocketOrderId?: string
  raw?: unknown
  error?: string
}

type ReversePickupInput = {
  orderId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  customerPincode: string
  customerCity: string
  customerState: string
  amount: number
}

type ForwardShipmentInput = {
  order_id: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  customer_address: string
  customer_pincode: string
  customer_city: string
  customer_state: string
}

const DEFAULT_STORE_NAME = 'Sajag Sports Store'
const DEFAULT_STORE_PHONE = '9999999999'
const DEFAULT_STORE_ADDRESS = 'Pune'
const DEFAULT_STORE_CITY = 'Pune'
const DEFAULT_STORE_STATE = 'Maharashtra'
const DEFAULT_STORE_PINCODE = '411028'

// Module-level token caching
let cachedToken: string | null = null
let tokenExpiryTime = 0

async function getShiprocketToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiryTime > now + 5 * 60 * 1000) {
    return cachedToken
  }

  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD

  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured')
  }

  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!authRes.ok) {
    throw new Error(`Shiprocket auth login failed with HTTP ${authRes.status}`)
  }

  const authData = await authRes.json()
  if (!authData.token) {
    throw new Error('Shiprocket auth response did not contain a token')
  }

  cachedToken = authData.token
  // Token expires in 24 hours
  tokenExpiryTime = Date.now() + 24 * 60 * 60 * 1000
  return authData.token
}

function getStorePickupLocation() {
  const env = getShiprocketEnv()
  const registeredLocationName = env.SHIPROCKET_PICKUP_LOCATION_NAME || env.SHIPROCKET_PICKUP_NAME
  const storeName = registeredLocationName || DEFAULT_STORE_NAME

  return {
    name: storeName,
    phone: env.SHIPROCKET_PICKUP_PHONE || DEFAULT_STORE_PHONE,
    add: env.SHIPROCKET_PICKUP_ADDRESS || DEFAULT_STORE_ADDRESS,
    city: env.SHIPROCKET_PICKUP_CITY || DEFAULT_STORE_CITY,
    state: env.SHIPROCKET_PICKUP_STATE || DEFAULT_STORE_STATE,
    pin: env.SHIPROCKET_PICKUP_PINCODE || DEFAULT_STORE_PINCODE,
    country: 'India',
  }
}

export async function createReversePickup(input: ReversePickupInput): Promise<ShiprocketCreateResult> {
  try {
    const token = await getShiprocketToken()

    const payload = {
      order_id: input.orderId + "-RET",
      order_date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
      channel_id: "",
      pickup_customer_name: input.customerName || "Customer",
      pickup_last_name: "",
      pickup_address: input.customerAddress,
      pickup_city: input.customerCity || "Unknown",
      pickup_state: input.customerState || "Unknown",
      pickup_country: "India",
      pickup_pincode: input.customerPincode,
      pickup_email: "customer@sajagsports.com",
      pickup_phone: input.customerPhone,
      shipping_customer_name: "Sajag Sports",
      shipping_last_name: "",
      shipping_address: "Pune",
      shipping_city: "Pune",
      shipping_country: "India",
      shipping_pincode: "411028",
      shipping_state: "Maharashtra",
      shipping_email: "store@sajagsports.com",
      shipping_phone: "9999999999",
      order_items: [
        {
          name: "Racquet Repair Service",
          sku: "RACQUET-REPAIR",
          units: 1,
          selling_price: input.amount.toString(),
        }
      ],
      payment_method: "Prepaid",
      sub_total: input.amount.toString(),
      length: 65,
      breadth: 25,
      height: 5,
      weight: 0.5
    }

    const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/return', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const createData = await createRes.json()

    if (!createRes.ok || !createData.order_id) {
      console.error('[Shiprocket API] Create reverse pickup failed:', createData)
      return {
        success: false,
        error: createData.message || 'Failed to create Shiprocket reverse pickup',
        raw: createData
      }
    }

    return {
      success: true,
      shiprocketOrderId: createData.order_id.toString(),
      waybill: createData.shipment_id ? createData.shipment_id.toString() : undefined,
      raw: createData
    }
  } catch (error: any) {
    console.error('[Shiprocket API] Create reverse pickup exception:', error)
    return {
      success: false,
      error: error.message || 'Graceful failure: Shiprocket service is unavailable',
    }
  }
}

export async function createForwardShipment(
  input: ForwardShipmentInput
): Promise<ShiprocketCreateResult> {
  try {
    const token = await getShiprocketToken()
    const store = getStorePickupLocation()

    const payload = {
      order_id: input.order_id,
      order_date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
      pickup_location: store.name,
      billing_customer_name: input.customer_name || "Customer",
      billing_last_name: "",
      billing_address: input.customer_address,
      billing_city: input.customer_city || "Unknown",
      billing_state: input.customer_state || "Unknown",
      billing_country: "India",
      billing_pincode: input.customer_pincode,
      billing_email: input.customer_email || "customer@sajagsports.com",
      billing_phone: input.customer_phone,
      shipping_is_billing: true,
      order_items: [
        {
          name: "Racquet Return Shipment",
          sku: "RACQUET-RETURN",
          units: 1,
          selling_price: "0.00",
        }
      ],
      payment_method: "Prepaid",
      sub_total: "0.00",
      length: 65,
      breadth: 25,
      height: 5,
      weight: 0.5
    }

    const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const createData = await createRes.json()

    if (!createRes.ok || !createData.order_id) {
      console.error('[Shiprocket API] Create forward shipment failed:', createData)
      return {
        success: false,
        error: createData.message || 'Failed to create Shiprocket forward shipment',
        raw: createData
      }
    }

    return {
      success: true,
      shiprocketOrderId: createData.order_id.toString(),
      waybill: createData.shipment_id ? createData.shipment_id.toString() : undefined,
      raw: createData
    }
  } catch (error: any) {
    console.error('[Shiprocket API] Create forward shipment exception:', error)
    return {
      success: false,
      error: error.message || 'Graceful failure: Shiprocket service is unavailable',
    }
  }
}

export async function trackShipment(awbCode: string): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  try {
    const token = await getShiprocketToken()
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Tracking failed with HTTP ${response.status}`,
      }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[Shiprocket API] Track shipment exception:', error)
    return {
      success: false,
      error: error.message || 'Graceful failure: Shiprocket service is unavailable',
    }
  }
}

export async function calculateSingleLegShipping(
  pincode: string
): Promise<{ success: boolean; legA: number; legB: number; total: number; grandTotal: number; error?: string }> {
  const pin = String(pincode || '').trim().replace(/\D/g, '')
  if (!pin || pin.length !== 6) {
    return { success: false, legA: 0, legB: 0, total: 0, grandTotal: 0, error: 'Invalid pincode. Please enter a valid 6-digit pincode.' }
  }

  const legB = 120
  return { success: true, legA: 0, legB, total: legB, grandTotal: legB }
}

export async function calculateRoundTripShipping(
  pincode: string
): Promise<{ success: boolean; legA: number; legB: number; total: number; grandTotal: number; error?: string }> {
  const pin = String(pincode || '').trim().replace(/\D/g, '')
  if (!pin || pin.length !== 6) {
    return { success: false, legA: 0, legB: 0, total: 0, grandTotal: 0, error: 'Invalid pincode. Please enter a valid 6-digit pincode.' }
  }

  const legA = 120
  const legB = 120
  const total = legA + legB

  return { success: true, legA, legB, total, grandTotal: total }
}

export async function checkPincodeServiceability(
  pincode: string
): Promise<{ serviceable: boolean; error?: string }> {
  if (!/^\d{6}$/.test(pincode)) {
    return { serviceable: false, error: 'Invalid pincode' }
  }
  return { serviceable: true }
}

