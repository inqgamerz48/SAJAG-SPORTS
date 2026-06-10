import { getShiprocketEnv } from '@/lib/env'

type ShiprocketCreateResult = {
  success: boolean
  waybill?: string
  shiprocketOrderId?: string
  raw?: unknown
  error?: string
  isValidationError?: boolean
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

  const decodedPassword = Buffer.from(password, 'base64').toString('utf-8')

  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: decodedPassword }),
  })

  if (authRes.status !== 200) {
    let bodyText = ''
    try {
      bodyText = await authRes.text()
    } catch (_) {}
    console.error(`[Shiprocket API] Auth login failed with HTTP ${authRes.status}. Response body:`, bodyText)
    throw new Error(`Shiprocket auth login failed with HTTP ${authRes.status}`)
  }

  const authData = await authRes.json()
  
  console.log('[DEBUG getShiprocketToken authData Keys]:', Object.keys(authData))
  if (authData && typeof authData === 'object') {
    console.log('[DEBUG getShiprocketToken Token Metadata]:', {
      hasToken: 'token' in authData && !!authData.token,
      tokenType: typeof authData.token,
      tokenLength: typeof authData.token === 'string' ? authData.token.length : 'N/A',
      tokenSegments: typeof authData.token === 'string' ? authData.token.split('.').length : 'N/A',
      tokenFirst15: typeof authData.token === 'string' ? authData.token.slice(0, 15) : 'N/A',
      tokenLast15: typeof authData.token === 'string' ? authData.token.slice(-15) : 'N/A',
    })
  }

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

export function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean.slice(2)
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    return clean.slice(1)
  }
  return clean.slice(-10)
}

export function validateShiprocketPayload(pickupPhone: string, pickupPincode: string) {
  if (!/^\d{10}$/.test(pickupPhone)) {
    throw new Error(`Invalid pickup phone number format: ${pickupPhone}. Must be a 10-digit number.`)
  }
  if (!/^\d{6}$/.test(pickupPincode)) {
    throw new Error(`Invalid pickup pincode format: ${pickupPincode}. Must be a 6-digit number.`)
  }
}

export async function createReversePickup(input: ReversePickupInput): Promise<ShiprocketCreateResult> {
  const cleanPhone = normalizePhone(input.customerPhone)

  try {
    validateShiprocketPayload(cleanPhone, input.customerPincode)
  } catch (validationErr: any) {
    console.warn('[Shiprocket API] Validation failure before API call:', validationErr.message)
    return {
      success: false,
      error: validationErr.message,
      isValidationError: true,
    }
  }

  try {
    let token: any
    let authSucceeded = false
    try {
      token = await getShiprocketToken()
      authSucceeded = true
    } catch (authErr: any) {
      console.error('[DEBUG createReversePickup getShiprocketToken failed]:', authErr)
      throw authErr
    }

    console.log('[DEBUG createReversePickup Token Info]:', {
      getShiprocketTokenSucceeded: authSucceeded,
      tokenType: typeof token,
      tokenLength: typeof token === 'string' ? token.length : 'N/A',
      tokenSegments: typeof token === 'string' ? token.split('.').length : 'N/A',
      tokenFirst15: typeof token === 'string' ? token.slice(0, 15) : 'N/A',
      tokenLast15: typeof token === 'string' ? token.slice(-15) : 'N/A',
      authHeaderIsExactlyBearerToken: typeof token === 'string' && `Bearer ${token}` === `Bearer ${token}` && `Bearer ${token}`.startsWith('Bearer ')
    })

    const payload = {
      order_id: input.orderId.replace(/-/g, '').slice(0, 20) + 'R',
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
      pickup_phone: cleanPhone,
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

    const endpointUrl = 'https://apiv2.shiprocket.in/v1/external/orders/create/return'
    console.log('[DEBUG createReversePickup Outgoing Request]:', {
      endpointUrl,
      payload: JSON.stringify(payload, null, 2)
    })

    const createRes = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (createRes.status !== 200) {
      let bodyText = ''
      try {
        bodyText = await createRes.text()
      } catch (_) {}
      console.error(`[Shiprocket API] Create reverse pickup failed with HTTP ${createRes.status}. Response body:`, bodyText)
      let parsedJson: any = null
      try {
        parsedJson = JSON.parse(bodyText)
      } catch (_) {}
      return {
        success: false,
        error: parsedJson?.message || 'Failed to create Shiprocket reverse pickup',
        raw: parsedJson || bodyText
      }
    }

    const createData = await createRes.json()

    console.log('[DEBUG createReversePickup Incoming Response]:', {
      status: createRes.status,
      body: JSON.stringify(createData, null, 2)
    })

    if (!createData.order_id) {
      console.error('[Shiprocket API] Create reverse pickup succeeded but response missing order_id:', createData)
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

    if (createRes.status !== 200) {
      let bodyText = ''
      try {
        bodyText = await createRes.text()
      } catch (_) {}
      console.error(`[Shiprocket API] Create forward shipment failed with HTTP ${createRes.status}. Response body:`, bodyText)
      let parsedJson: any = null
      try {
        parsedJson = JSON.parse(bodyText)
      } catch (_) {}
      return {
        success: false,
        error: parsedJson?.message || 'Failed to create Shiprocket forward shipment',
        raw: parsedJson || bodyText
      }
    }

    const createData = await createRes.json()

    if (!createData.order_id) {
      console.error('[Shiprocket API] Create forward shipment succeeded but response missing order_id:', createData)
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

    if (response.status !== 200) {
      let bodyText = ''
      try {
        bodyText = await response.text()
      } catch (_) {}
      console.error(`[Shiprocket API] Track shipment failed with HTTP ${response.status}. Response body:`, bodyText)
      let parsedJson: any = null
      try {
        parsedJson = JSON.parse(bodyText)
      } catch (_) {}
      return {
        success: false,
        error: parsedJson?.error || parsedJson?.message || `Tracking failed with HTTP ${response.status}`,
      }
    }

    const data = await response.json()

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

