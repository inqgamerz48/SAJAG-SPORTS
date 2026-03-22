import { getDelhiveryEnv } from '@/lib/env'

type DelhiveryShipmentPayload = {
  name: string
  add: string
  pin: string
  city: string
  state: string
  country: string
  phone: string
  order: string
  payment_mode: 'Pickup' | 'Prepaid' | 'COD'
  products_desc: string
  weight: string
  quantity: number
  total_amount: string
  seller_gst_tin?: string
  hsn_code?: string
}

type DelhiveryCreateResult = {
  success: boolean
  waybill?: string
  delhiveryOrderId?: string
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

const DELHIVERY_CREATE_URL = 'https://track.delhivery.com/api/cmu/create.json'
const DELHIVERY_TRACK_URL = 'https://track.delhivery.com/api/v1/packages/json/'
const DEFAULT_STORE_NAME = 'Sajag Sports Store'
const DEFAULT_STORE_PHONE = '9999999999'
const DEFAULT_STORE_ADDRESS = 'Pune'
const DEFAULT_STORE_CITY = 'Pune'
const DEFAULT_STORE_STATE = 'Maharashtra'
const DEFAULT_STORE_PINCODE = '411028'

function getStorePickupLocation() {
  const env = getDelhiveryEnv()
  const registeredLocationName = env.DELHIVERY_PICKUP_LOCATION_NAME || env.DELHIVERY_PICKUP_NAME
  const storeName = registeredLocationName || DEFAULT_STORE_NAME

  return {
    name: storeName,
    phone: env.DELHIVERY_PICKUP_PHONE || DEFAULT_STORE_PHONE,
    add: env.DELHIVERY_PICKUP_ADDRESS || DEFAULT_STORE_ADDRESS,
    city: env.DELHIVERY_PICKUP_CITY || DEFAULT_STORE_CITY,
    state: env.DELHIVERY_PICKUP_STATE || DEFAULT_STORE_STATE,
    pin: env.DELHIVERY_PICKUP_PINCODE || DEFAULT_STORE_PINCODE,
    country: 'India',
  }
}

function getPickupLocationNameCandidates(): string[] {
  const env = getDelhiveryEnv()
  const candidates = [
    env.DELHIVERY_PICKUP_LOCATION_NAME?.trim(),
    env.DELHIVERY_PICKUP_NAME?.trim(),
    DEFAULT_STORE_NAME,
  ].filter((name): name is string => Boolean(name))
  return [...new Set(candidates)]
}

async function postCreateShipment(payload: {
  shipments: DelhiveryShipmentPayload[]
  pickup_location: {
    name: string
    add: string
    city: string
    pin: string
    phone: string
    country: string
    state: string
  }
  client?: string
}) {
  const { DELHIVERY_API_TOKEN } = getDelhiveryEnv()
  const body = new URLSearchParams({
    format: 'json',
    data: JSON.stringify(payload),
  })

  const response = await fetch(DELHIVERY_CREATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DELHIVERY_API_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  let responseJson: any = null
  try {
    responseJson = await response.json()
  } catch {
    // Ignore parsing failure and return response text fallback.
  }

  if (!response.ok) {
    const message =
      responseJson?.error ||
      responseJson?.message ||
      responseJson?.rmk ||
      `Delhivery create failed with HTTP ${response.status}`
    console.error('[Delhivery API] Create failed:', {
      status: response.status,
      statusText: response.statusText,
      body: responseJson,
    })
    throw new Error(message)
  }

  return responseJson
}

function toCreateResult(raw: any): DelhiveryCreateResult {
  const apiSuccess = raw?.success !== false && raw?.error !== true
  if (!apiSuccess) {
    const message =
      raw?.rmk ||
      raw?.message ||
      (typeof raw?.error === 'string' ? raw.error : null) ||
      'Delhivery rejected shipment creation'
    return {
      success: false,
      error: String(message),
      raw,
    }
  }

  const packageWaybill =
    raw?.packages?.[0]?.waybill || raw?.packages?.[0]?.awb || raw?.waybill || raw?.awb
  const packageRef =
    raw?.packages?.[0]?.refnum || raw?.packages?.[0]?.shipment_id || raw?.shipment_id

  if (!packageWaybill && !packageRef) {
    return {
      success: false,
      error:
        raw?.rmk ||
        raw?.message ||
        'Delhivery response did not include AWB or order reference',
      raw,
    }
  }

  return {
    success: true,
    waybill: packageWaybill ? String(packageWaybill) : undefined,
    delhiveryOrderId: packageRef ? String(packageRef) : undefined,
    raw,
  }
}

export async function createReversePickup(input: ReversePickupInput): Promise<DelhiveryCreateResult> {
  const store = getStorePickupLocation()
  const env = getDelhiveryEnv()
  const pickupLocationNameCandidates = getPickupLocationNameCandidates()
  const shipment: DelhiveryShipmentPayload = {
    name: input.customerName || 'Customer',
    add: input.customerAddress,
    pin: input.customerPincode,
    city: input.customerCity || 'Unknown',
    state: input.customerState || 'Unknown',
    country: 'India',
    phone: input.customerPhone,
    order: input.orderId,
    payment_mode: 'Pickup',
    products_desc: 'Racquet Repair Pickup',
    weight: '0.5',
    quantity: 1,
    total_amount: input.amount.toFixed(2),
  }
  if (env.DELHIVERY_SELLER_GST_TIN) shipment.seller_gst_tin = env.DELHIVERY_SELLER_GST_TIN
  if (env.DELHIVERY_HSN_CODE) shipment.hsn_code = env.DELHIVERY_HSN_CODE

  const payload = {
    shipments: [shipment],
    pickup_location: {
      name: store.name,
      add: store.add,
      city: store.city,
      pin: store.pin,
      phone: store.phone,
      country: store.country,
      state: store.state,
    },
    ...(env.DELHIVERY_CLIENT_NAME && { client: env.DELHIVERY_CLIENT_NAME }),
  }

  let lastError: unknown = null

  for (const pickupName of pickupLocationNameCandidates) {
    try {
      const raw = await postCreateShipment({
        ...payload,
        pickup_location: {
          ...payload.pickup_location,
          name: pickupName,
        },
      })
      const result = toCreateResult(raw)
      if (result.success) return result
      lastError = new Error(result.error || 'Delhivery rejected shipment creation')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      lastError = error
      // Retry only for warehouse-name mismatch using alternative registered name.
      if (
        message.includes('ClientWarehouse matching query does not exist') &&
        pickupName !== pickupLocationNameCandidates[pickupLocationNameCandidates.length - 1]
      ) {
        continue
      }
      throw error
    }
  }

  if (lastError instanceof Error) throw lastError
  throw new Error('Delhivery reverse pickup failed')
}

export async function createForwardShipment(
  input: ForwardShipmentInput
): Promise<DelhiveryCreateResult> {
  const store = getStorePickupLocation()
  const payload = {
    shipments: [
      {
        name: input.customer_name || 'Customer',
        add: input.customer_address,
        pin: input.customer_pincode,
        city: input.customer_city || 'Unknown',
        state: input.customer_state || 'Unknown',
        country: 'India',
        phone: input.customer_phone,
        order: input.order_id,
        payment_mode: 'Prepaid' as const,
        products_desc: 'Racquet Return Shipment',
        weight: '0.5',
        quantity: 1,
        total_amount: '0.00',
      },
    ],
    pickup_location: {
      name: store.name,
      add: store.add,
      city: store.city,
      pin: store.pin,
      phone: store.phone,
      country: store.country,
      state: store.state,
    },
  }

  try {
    const raw = await postCreateShipment(payload)
    return toCreateResult(raw)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create forward shipment',
    }
  }
}

export async function trackShipment(awbCode: string): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  try {
    const { DELHIVERY_API_TOKEN } = getDelhiveryEnv()
    const url = new URL(DELHIVERY_TRACK_URL)
    url.searchParams.set('waybill', awbCode)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token ${DELHIVERY_API_TOKEN}`,
      },
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Tracking failed with HTTP ${response.status}`,
      }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tracking request failed',
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
