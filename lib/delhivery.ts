/**
 * Delhivery One API Integration
 * 
 * Handles reverse logistics (customer → workshop) and forward shipments (workshop → customer)
 * for Sajag Sports badminton racquet repair service.
 */

import { createAdminClient } from './supabase/admin'

// Delhivery API Configuration
const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com'
const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN

// Workshop Details (Noida)
const WORKSHOP_NAME = 'Sajag Sports Workshop'
const WORKSHOP_ADDRESS = 'Sector 62, Noida'
const WORKSHOP_CITY = 'Noida'
const WORKSHOP_STATE = 'Uttar Pradesh'
const WORKSHOP_PINCODE = '201301'
const WORKSHOP_PHONE = '9876543210'
const WORKSHOP_EMAIL = 'workshop@sajagsports.com'

// Standard Racquet Dimensions
const RACQUET_LENGTH = 69 // cm
const RACQUET_WIDTH = 25 // cm
const RACQUET_HEIGHT = 5 // cm
const RACQUET_WEIGHT = 2.0 // kg

/**
 * Get Delhivery API Token
 */
export function getDelhiveryToken(): string {
    if (!DELHIVERY_API_TOKEN) {
        throw new Error('DELHIVERY_API_TOKEN not configured in environment variables')
    }
    return DELHIVERY_API_TOKEN
}

/**
 * Check Pincode Serviceability
 */
export async function checkPincodeServiceability(pincode: string) {
    try {
        const token = getDelhiveryToken()

        const response = await fetch(
            `${DELHIVERY_API_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await response.json()

        if (data.delivery_codes && data.delivery_codes.length > 0) {
            const pincodeData = data.delivery_codes[0]
            return {
                serviceable: pincodeData.postal_code.pickup === 'Y' && pincodeData.postal_code.prepaid === 'Y',
                pincode: pincodeData.postal_code.pin,
                city: pincodeData.postal_code.district,
                state: pincodeData.postal_code.state_code,
                cod_available: pincodeData.postal_code.cod === 'Y',
            }
        }

        return {
            serviceable: false,
            error: 'Pincode not serviceable',
        }
    } catch (error) {
        console.error('Delhivery pincode check error:', error)
        return {
            serviceable: false,
            error: 'Failed to check pincode serviceability',
        }
    }
}

/**
 * Create Reverse Pickup (Customer → Workshop)
 * 
 * Two-step process:
 * 1. Manifestation via /api/cmu/create.json
 * 2. Pickup Scheduling via /fm/request/new/
 */
export async function createReversePickup(orderData: {
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
        const token = getDelhiveryToken()

        // Step 1: Manifestation
        const shipmentData = {
            shipments: [
                {
                    name: WORKSHOP_NAME,
                    add: WORKSHOP_ADDRESS,
                    pin: WORKSHOP_PINCODE,
                    city: WORKSHOP_CITY,
                    state: WORKSHOP_STATE,
                    country: 'India',
                    phone: WORKSHOP_PHONE,
                    order: `REV-${orderData.order_id}`,
                    payment_mode: 'Pickup',
                    return_pin: orderData.customer_pincode,
                    return_city: orderData.customer_city,
                    return_phone: orderData.customer_phone,
                    return_add: orderData.customer_address,
                    return_state: orderData.customer_state,
                    return_country: 'India',
                    products_desc: 'Badminton Racquet for Repair',
                    hsn_code: '',
                    cod_amount: '',
                    order_date: new Date().toISOString().split('T')[0],
                    total_amount: '',
                    seller_add: orderData.customer_address,
                    seller_name: orderData.customer_name,
                    seller_inv: '',
                    quantity: '1',
                    waybill: '',
                    shipment_width: RACQUET_WIDTH.toString(),
                    shipment_height: RACQUET_HEIGHT.toString(),
                    weight: RACQUET_WEIGHT.toString(),
                    seller_gst_tin: '',
                    shipping_mode: 'Surface',
                    address_type: 'home',
                    fragile_shipment: true,
                },
            ],
            pickup_location: {
                name: orderData.customer_name,
                add: orderData.customer_address,
                city: orderData.customer_city,
                pin_code: orderData.customer_pincode,
                country: 'India',
                phone: orderData.customer_phone,
            },
        }

        // Delhivery uses legacy format=json&data={...} structure
        const formData = new URLSearchParams()
        formData.append('format', 'json')
        formData.append('data', JSON.stringify(shipmentData))

        const manifestResponse = await fetch(`${DELHIVERY_API_URL}/api/cmu/create.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        })

        const manifestData = await manifestResponse.json()

        if (!manifestData.success) {
            throw new Error(manifestData.remark || 'Manifestation failed')
        }

        const waybill = manifestData.packages?.[0]?.waybill || manifestData.waybill

        // Step 2: Schedule Pickup
        const pickupData = {
            pickup_location: orderData.customer_pincode,
            pickup_time: '09:00',
            pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            expected_package_count: 1,
        }

        const pickupFormData = new URLSearchParams()
        Object.entries(pickupData).forEach(([key, value]) => {
            pickupFormData.append(key, value.toString())
        })

        const pickupResponse = await fetch(`${DELHIVERY_API_URL}/fm/request/new/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: pickupFormData.toString(),
        })

        const pickupResponseData = await pickupResponse.json()

        return {
            success: true,
            waybill,
            pickup_id: pickupResponseData.pickup_id || pickupResponseData.data?.pickup_id,
            delhivery_order_id: manifestData.packages?.[0]?.client || `REV-${orderData.order_id}`,
        }
    } catch (error: any) {
        console.error('Delhivery reverse pickup error:', error)

        // Log error to database
        const supabase = createAdminClient()
        await supabase.from('logistics_error_logs').insert({
            order_id: orderData.order_id,
            api_endpoint: '/api/cmu/create.json',
            error_message: error.message,
            error_payload: orderData,
        })

        return {
            success: false,
            error: error.message || 'Failed to create reverse pickup',
        }
    }
}

/**
 * Create Forward Shipment (Workshop → Customer)
 */
export async function createForwardShipment(orderData: {
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
        const token = getDelhiveryToken()

        const shipmentData = {
            shipments: [
                {
                    name: orderData.customer_name,
                    add: orderData.customer_address,
                    pin: orderData.customer_pincode,
                    city: orderData.customer_city,
                    state: orderData.customer_state,
                    country: 'India',
                    phone: orderData.customer_phone,
                    order: `FWD-${orderData.order_id}`,
                    payment_mode: 'Prepaid',
                    return_pin: WORKSHOP_PINCODE,
                    return_city: WORKSHOP_CITY,
                    return_phone: WORKSHOP_PHONE,
                    return_add: WORKSHOP_ADDRESS,
                    return_state: WORKSHOP_STATE,
                    return_country: 'India',
                    products_desc: 'Repaired Badminton Racquet',
                    hsn_code: '',
                    cod_amount: '',
                    order_date: new Date().toISOString().split('T')[0],
                    total_amount: '500',
                    seller_add: WORKSHOP_ADDRESS,
                    seller_name: WORKSHOP_NAME,
                    seller_inv: '',
                    quantity: '1',
                    waybill: '',
                    shipment_width: RACQUET_WIDTH.toString(),
                    shipment_height: RACQUET_HEIGHT.toString(),
                    weight: RACQUET_WEIGHT.toString(),
                    seller_gst_tin: '',
                    shipping_mode: 'Surface',
                    address_type: 'home',
                    fragile_shipment: true,
                },
            ],
            pickup_location: {
                name: WORKSHOP_NAME,
                add: WORKSHOP_ADDRESS,
                city: WORKSHOP_CITY,
                pin_code: WORKSHOP_PINCODE,
                country: 'India',
                phone: WORKSHOP_PHONE,
            },
        }

        const formData = new URLSearchParams()
        formData.append('format', 'json')
        formData.append('data', JSON.stringify(shipmentData))

        const response = await fetch(`${DELHIVERY_API_URL}/api/cmu/create.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        })

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.remark || 'Forward shipment creation failed')
        }

        return {
            success: true,
            waybill: data.packages?.[0]?.waybill || data.waybill,
            delhivery_order_id: data.packages?.[0]?.client || `FWD-${orderData.order_id}`,
        }
    } catch (error: any) {
        console.error('Delhivery forward shipment error:', error)

        const supabase = createAdminClient()
        await supabase.from('logistics_error_logs').insert({
            order_id: orderData.order_id,
            api_endpoint: '/api/cmu/create.json (forward)',
            error_message: error.message,
            error_payload: orderData,
        })

        return {
            success: false,
            error: error.message || 'Failed to create forward shipment',
        }
    }
}

/**
 * Track Shipment by Waybill
 */
export async function trackShipment(waybill: string) {
    try {
        const token = getDelhiveryToken()

        const response = await fetch(
            `${DELHIVERY_API_URL}/api/v1/packages/json/?waybill=${waybill}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await response.json()

        if (data.ShipmentData && data.ShipmentData.length > 0) {
            const shipment = data.ShipmentData[0].Shipment
            return {
                success: true,
                waybill: shipment.Waybill,
                status: shipment.Status.Status,
                status_code: shipment.Status.StatusCode,
                current_location: shipment.Status.StatusLocation,
                expected_delivery: shipment.ExpectedDeliveryDate,
                scans: shipment.Scans || [],
            }
        }

        return {
            success: false,
            error: 'Shipment not found',
        }
    } catch (error: any) {
        console.error('Delhivery tracking error:', error)
        return {
            success: false,
            error: error.message || 'Failed to track shipment',
        }
    }
}

/**
 * Calculate Shipping Cost (Estimate)
 */
export async function calculateShippingCost(
    fromPincode: string,
    toPincode: string,
    weight: number = RACQUET_WEIGHT
) {
    try {
        const token = getDelhiveryToken()

        const response = await fetch(
            `${DELHIVERY_API_URL}/api/kinko/v1/invoice/charges/.json?md=S&ss=Delivered&d_pin=${toPincode}&o_pin=${fromPincode}&cgm=${weight * 1000}&pt=Pre-paid`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await response.json()

        if (data[0]) {
            return {
                success: true,
                total_amount: data[0].total_amount,
                freight_charge: data[0].freight_charge,
                cod_charges: data[0].cod_charges,
            }
        }

        return {
            success: false,
            error: 'Unable to calculate shipping cost',
        }
    } catch (error: any) {
        console.error('Delhivery cost calculation error:', error)
        return {
            success: false,
            error: error.message || 'Failed to calculate shipping cost',
        }
    }
}

/**
 * Calculate Round-Trip Shipping Cost
 */
export async function calculateRoundTripShipping(customerPincode: string) {
    try {
        // Leg A: Customer → Workshop
        const legA = await calculateShippingCost(customerPincode, WORKSHOP_PINCODE)

        // Leg B: Workshop → Customer
        const legB = await calculateShippingCost(WORKSHOP_PINCODE, customerPincode)

        if (legA.success && legB.success) {
            const total = (legA.total_amount || 0) + (legB.total_amount || 0)
            const shippingGst = total * 0.18

            return {
                success: true,
                legA: legA.total_amount || 0,
                legB: legB.total_amount || 0,
                total,
                shippingGst,
                grandTotal: total + shippingGst,
            }
        }

        return {
            success: false,
            error: 'Unable to calculate round-trip shipping',
        }
    } catch (error: any) {
        console.error('Round-trip calculation error:', error)
        return {
            success: false,
            error: error.message || 'Failed to calculate round-trip shipping',
        }
    }
}

/**
 * Calculate Single Leg Shipping Cost (Workshop → Customer)
 * For physical product orders that do not require a racquet pickup
 */
export async function calculateSingleLegShipping(customerPincode: string) {
    try {
        // Leg B: Workshop → Customer
        const legB = await calculateShippingCost(WORKSHOP_PINCODE, customerPincode)

        if (legB.success) {
            const total = legB.total_amount || 0
            const shippingGst = total * 0.18

            return {
                success: true,
                legA: 0,
                legB: total,
                total,
                shippingGst,
                grandTotal: total + shippingGst,
            }
        }

        return {
            success: false,
            error: 'Unable to calculate single-leg delivery shipping',
        }
    } catch (error: any) {
        console.error('Single-leg calculation error:', error)
        return {
            success: false,
            error: error.message || 'Failed to calculate delivery shipping',
        }
    }
}
