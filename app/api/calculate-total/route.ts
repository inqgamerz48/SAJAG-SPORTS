import { NextRequest, NextResponse } from 'next/server'
import { calculateRoundTripShipping } from '@/lib/shiprocket'
import { z } from 'zod'

const calculateTotalSchema = z.object({
  serviceType: z.literal('repair', { errorMap: () => ({ message: 'This endpoint is for repair service only' }) }),
  customerPincode: z.string().min(1, 'customerPincode is required'),
  racketValue: z.number().min(0, 'racketValue must be positive'),
  crackCount: z.number().int().min(1).max(10).optional(),
  stringType: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = calculateTotalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const {
      serviceType,
      customerPincode,
      racketValue,
      crackCount,
      stringType,
    } = parsed.data

    // Extract pincode from address if full address provided
    const pincodeMatch = String(customerPincode || '').match(/\b\d{6}\b/)
    const rawPin = pincodeMatch ? pincodeMatch[0] : String(customerPincode || '').trim().replace(/\D/g, '').slice(0, 6)
    const pincode = rawPin.length === 6 ? rawPin : ''

    if (!pincode) {
      return NextResponse.json(
        { error: 'Invalid pincode format. Please provide a 6-digit pincode.' },
        { status: 400 }
      )
    }

    // Step 1: Repair price by racquet value + stringing cost (if any)
    const { getRepairSettings } = await import('@/lib/pricing')
    const repairSettings = await getRepairSettings()

    const repairCostByValue = racketValue < repairSettings.threshold ? repairSettings.priceBelow : repairSettings.priceAbove
    let serviceCost = 0
    let repairCost = 0
    let stringCost = 0
    let serviceDescription = ''

    if (stringType === 'none' || !stringType) {
      repairCost = repairCostByValue
      serviceCost = repairCostByValue
      const thresholdFormatted = repairSettings.threshold.toLocaleString('en-IN')
      serviceDescription = racketValue < repairSettings.threshold 
        ? `Repair Only (Below ₹${thresholdFormatted})` 
        : `Repair Only (Above ₹${thresholdFormatted})`
    } else {
      repairCost = repairCostByValue
      stringCost = (await import('@/lib/pricing')).STRING_PRICES[stringType] || 0
      serviceCost = repairCost + stringCost
      serviceDescription = `Repair + ${stringType} Stringing`
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
        error: 'Failed to calculate total order price',
        reason: 'An unexpected internal error occurred during checkout total calculation.'
      },
      { status: 500 }
    )
  }
}
