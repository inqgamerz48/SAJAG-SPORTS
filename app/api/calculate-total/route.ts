import { NextRequest, NextResponse } from 'next/server'
import { calculateRoundTripShipping } from '@/lib/delhivery'

/**
 * Calculate total for repair service:
 * - Repair price by racquet value: below ₹5K = ₹499, above ₹5K = ₹599
 * - Plus stringing cost if selected: BG65 (total ₹650 with repair), BG65 Titanium (total ₹700 with repair)
 * - Plus round-trip shipping (Shiprocket Leg A + Leg B)
 * - PLUS 18% GST on shipping only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      serviceType,
      customerPincode,
      racketValue,
      crackCount,
      stringType,
    } = body

    // Validate required fields for repair service
    if (serviceType !== 'repair') {
      return NextResponse.json(
        { error: 'This endpoint is for repair service only' },
        { status: 400 }
      )
    }

    if (!customerPincode || !racketValue) {
      return NextResponse.json(
        { error: 'Missing required fields: customerPincode, racketValue' },
        { status: 400 }
      )
    }

    // Extract pincode from address if full address provided
    const pincodeMatch = customerPincode.match(/\b\d{6}\b/)
    const pincode = pincodeMatch ? pincodeMatch[0] : customerPincode

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Invalid pincode format. Please provide a 6-digit pincode.' },
        { status: 400 }
      )
    }

    // Step 1: Repair price by racquet value + stringing cost (if any)
    const repairCostByValue = racketValue < 5000 ? 499 : 599
    let serviceCost = 0
    let repairCost = 0
    let stringCost = 0
    let serviceDescription = ''

    if (stringType === 'none' || !stringType) {
      repairCost = repairCostByValue
      serviceCost = repairCostByValue
      serviceDescription = racketValue < 5000 ? 'Repair Only (Below ₹5,000)' : 'Repair Only (Above ₹5,000)'
    } else if (stringType === 'BG65') {
      repairCost = repairCostByValue
      stringCost = 650 - repairCostByValue
      serviceCost = 650
      serviceDescription = 'Repair + BG65 Stringing'
    } else if (stringType === 'BG65_TI') {
      repairCost = repairCostByValue
      stringCost = 700 - repairCostByValue
      serviceCost = 700
      serviceDescription = 'Repair + BG65 Titanium Stringing'
    }

    // Step 2: Calculate Round-Trip Shipping via Shiprocket
    let shippingCost = 0
    let legA = 0
    let legB = 0
    let shippingMessage: string | undefined

    try {
      const shippingResult = await calculateRoundTripShipping(pincode)

      if (shippingResult.total && !shippingResult.error) {
        shippingCost = shippingResult.total
        legA = shippingResult.legA
        legB = shippingResult.legB
      } else {
        shippingMessage = shippingResult.error || 'Shipping rates unavailable for this pincode. You can self-ship or contact us.'
      }
    } catch (shipErr) {
      console.error('Shiprocket calculation error:', shipErr)
      shippingMessage = 'Could not fetch shipping rates. Please try again or contact us.'
    }

    // Step 3: Total = repair + stringing + shipping + 18% GST on shipping
    const shippingGst = shippingCost * 0.18
    const total = serviceCost + shippingCost + shippingGst

    return NextResponse.json({
      success: true,
      breakdown: {
        serviceCost,
        repairCost,
        stringCost,
        shippingCost,
        shippingGst,
        legA,
        legB,
        subtotal: serviceCost + shippingCost,
        total,
        serviceDescription,
        shippingMessage,
      },
      pricing: {
        stringType,
        racketValue,
      },
    })
  } catch (error) {
    console.error('Calculate Total API Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to calculate total',
      },
      { status: 500 }
    )
  }
}
