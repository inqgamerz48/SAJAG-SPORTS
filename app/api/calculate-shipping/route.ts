import { NextRequest, NextResponse } from 'next/server'
import { calculateRoundTripShipping } from '@/lib/shiprocket'
import { z } from 'zod'

const calculateShippingSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode is required'),
  items: z.array(z.object({
    type: z.string().optional(),
    serviceType: z.string().optional(),
  })).optional().default([]),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = calculateShippingSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() },
                { status: 400 }
            )
        }
        const { pincode, items } = parsed.data
        const pin = pincode.trim()

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

        const result = await calculateRoundTripShipping(pin)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Unable to calculate round-trip shipping for this pincode. Please check the pincode or contact us.' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            serviceable: true,
            pincode: pin,
            rates: {
                courier_name: 'Shiprocket Surface',
                rate: result.grandTotal || 200, // Fallback if 0
                etd: '3-4 days'
            },
            isRoundTrip: true
        })
    } catch (error) {
        console.error('Shipping calculation API error:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to calculate shipping rate', 
                reason: 'An unexpected internal error occurred during the shipping calculation.' 
            },
            { status: 500 }
        )
    }
}
