import { NextRequest, NextResponse } from 'next/server'
import { checkPincodeServiceability } from '@/lib/delhivery'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { pincode } = body

        if (!pincode || pincode.length !== 6) {
            return NextResponse.json(
                { success: false, error: 'Valid 6-digit pincode is required' },
                { status: 400 }
            )
        }

        const result = await checkPincodeServiceability(pincode)

        if (!result.serviceable) {
            return NextResponse.json(
                { success: false, error: result.error || 'Location not serviceable' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            serviceable: true,
            pincode: result.pincode,
            city: result.city,
            state: result.state,
            cod_available: result.cod_available,
        })
    } catch (error) {
        console.error('Shipping calculation API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
