import { NextRequest, NextResponse } from 'next/server'
import { calculatePricingBreakdown, validatePricingInputs } from '@/lib/pricing'
import { calculateRoundTripShipping, calculateSingleLegShipping } from '@/lib/delhivery'

/**
 * Calculate complete pricing quote including Delhivery shipping
 * 
 * POST /api/calculate-quote
 * Body: { racquetValue, numberOfCracks, stringType, pickupPincode }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { items, customerPincode } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Cart is empty' },
                { status: 400 }
            )
        }

        if (!customerPincode || !/^\d{6}$/.test(customerPincode)) {
            return NextResponse.json(
                { success: false, error: 'Valid 6-digit Pincode is required for shipping calculations' },
                { status: 400 }
            )
        }

        // Check if there are any physical products or services that require round-trip shipping
        const hasServices = items.some((item: any) => item.type === 'service')
        const hasPhysical = items.some((item: any) => item.type === 'physical')

        const requiresShipping = hasServices || hasPhysical

        let shippingResult: any = { success: true, legA: 0, legB: 0, total: 0, error: undefined }

        if (requiresShipping) {
            if (hasServices) {
                // Determine it's a service request, needing a round trip (pickup & return)
                shippingResult = await calculateRoundTripShipping(customerPincode)
            } else if (hasPhysical) {
                // Cart only contains physical products, meaning we only need to deliver to them (Leg B)
                shippingResult = await calculateSingleLegShipping(customerPincode)
            }

            if (!shippingResult.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: shippingResult.error || 'Unable to calculate shipping for this pincode',
                    },
                    { status: 400 }
                )
            }
        }

        if (!shippingResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: shippingResult.error || 'Unable to calculate shipping for this pincode',
                },
                { status: 400 }
            )
        }

        // Calculate aggregate cart pricing
        let subtotal = 0;
        items.forEach((item: any) => {
            subtotal += (item.price * item.quantity);
        })

        const shippingTotal = shippingResult.total || 0
        const grandTotal = subtotal + shippingTotal

        return NextResponse.json({
            success: true,
            breakdown: {
                // Return total aggregation so the frontend can display checkout fees
                subtotal: subtotal,
                shippingCost: shippingTotal,
                legA: shippingResult.legA || 0,
                legB: shippingResult.legB || 0,
                total: grandTotal,
                shippingMessage: requiresShipping
                    ? (hasServices ? `Round-trip service active for ${customerPincode}` : `Delivery calculated for ${customerPincode}`)
                    : 'No shipping required.'
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
