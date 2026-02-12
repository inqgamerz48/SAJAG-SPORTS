import { NextRequest, NextResponse } from 'next/server'
import { calculatePricingBreakdown, validatePricingInputs } from '@/lib/pricing'
import { calculateRoundTripShipping } from '@/lib/delhivery'

/**
 * Calculate complete pricing quote including Delhivery shipping
 * 
 * POST /api/calculate-quote
 * Body: { racquetValue, numberOfCracks, stringType, pickupPincode }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { racquetValue, numberOfCracks, stringType, pickupPincode } = body

        // Validate inputs
        const validation = validatePricingInputs({
            racquetValue: Number(racquetValue),
            numberOfCracks: Number(numberOfCracks),
            stringType,
            pickupPincode,
        })

        if (!validation.valid) {
            return NextResponse.json(
                { success: false, errors: validation.errors },
                { status: 400 }
            )
        }

        // Calculate round-trip shipping from Delhivery
        const shippingResult = await calculateRoundTripShipping(pickupPincode)

        if (!shippingResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: shippingResult.error || 'Unable to calculate shipping for this pincode',
                },
                { status: 400 }
            )
        }

        // Calculate complete pricing breakdown
        const breakdown = calculatePricingBreakdown(
            Number(racquetValue),
            Number(numberOfCracks),
            stringType,
            shippingResult.total || 0
        )

        return NextResponse.json({
            success: true,
            breakdown: {
                // Repair details
                repairCost: breakdown.repairCost,
                repairRate: breakdown.repairRate,
                numberOfCracks: breakdown.numberOfCracks,
                category: breakdown.category,

                // String details
                stringCost: breakdown.stringCost,
                stringName: breakdown.stringName,

                // Shipping details
                shippingCost: breakdown.shippingCost,
                shippingGst: breakdown.shippingGst,
                shippingBreakdown: {
                    legA: shippingResult.legA,
                    legB: shippingResult.legB,
                },

                // Totals
                subtotal: breakdown.subtotal,
                grandTotal: breakdown.grandTotal,
            },
        })
    } catch (error: any) {
        console.error('Calculate quote error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
