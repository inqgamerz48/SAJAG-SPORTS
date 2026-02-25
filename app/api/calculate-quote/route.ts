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
        // (Currently all services imply pickup/return logistics)
        const requiresShipping = items.some((item: any) => item.type === 'service' || item.type === 'physical')

        let shippingResult: any = { success: true, legA: 0, legB: 0, total: 0, error: undefined }

        if (requiresShipping) {
            // Calculate round-trip shipping from Delhivery
            shippingResult = await calculateRoundTripShipping(customerPincode)

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
                shippingMessage: requiresShipping ? `Service active for ${customerPincode}` : 'No shipping required.'
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
