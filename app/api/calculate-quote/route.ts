import { NextRequest, NextResponse } from 'next/server'
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
        const pin = String(customerPincode || '').trim().replace(/\D/g, '').slice(0, 6)

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Cart is empty' },
                { status: 400 }
            )
        }

        if (!pin || pin.length !== 6) {
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
                shippingResult = await calculateRoundTripShipping(pin)
            } else if (hasPhysical) {
                // Cart only contains physical products, meaning we only need to deliver to them (Leg B)
                shippingResult = await calculateSingleLegShipping(pin)
            }

            if (!shippingResult.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: shippingResult.error || 'Unable to calculate round-trip shipping for this pincode. Please check the pincode or contact us.',
                    },
                    { status: 400 }
                )
            }
        }

        if (!shippingResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: shippingResult.error || 'Unable to calculate round-trip shipping for this pincode. Please check the pincode or contact us.',
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
                    ? (hasServices ? `Round-trip service active for ${pin}` : `Delivery calculated for ${pin}`)
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
