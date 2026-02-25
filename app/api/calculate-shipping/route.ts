import { NextRequest, NextResponse } from 'next/server'
import { calculateRoundTripShipping } from '@/lib/delhivery'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { pincode, items = [] } = body

        if (!pincode || pincode.length !== 6) {
            return NextResponse.json(
                { success: false, error: 'Valid 6-digit pincode is required' },
                { status: 400 }
            )
        }

        // Determine if there are any service items in the cart
        const hasServiceItems = items.some((item: any) => item.type === 'service' || item.serviceType)

        // For Products-only cart, use standard flat rate
        if (!hasServiceItems && items.length > 0) {
            return NextResponse.json({
                success: true,
                serviceable: true,
                pincode: pincode,
                rates: {
                    courier_name: "Standard Ground",
                    rate: 100, // Flat rate for products
                    etd: "3-5 days"
                },
                isRoundTrip: false
            })
        }

        const result = await calculateRoundTripShipping(pincode)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Location not serviceable' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            serviceable: true,
            pincode: pincode,
            rates: {
                courier_name: 'Delhivery Surface',
                rate: result.grandTotal || 200, // Fallback if 0
                etd: '3-4 days'
            },
            isRoundTrip: true
        })
    } catch (error) {
        console.error('Shipping calculation API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
