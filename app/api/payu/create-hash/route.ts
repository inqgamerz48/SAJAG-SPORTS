import { NextRequest, NextResponse } from 'next/server'
import { generatePayUHash } from '@/lib/payu'
import { createClient } from '@/lib/supabase/server'
import { calculatePricingBreakdown } from '@/lib/pricing'
import { calculateRoundTripShipping } from '@/lib/delhivery'

/**
 * Create PayU Payment Hash with New Pricing Engine
 * 
 * POST /api/payu/create-hash
 * Body: { racquetValue, numberOfCracks, stringType, pickupPincode, customerDetails, racquetDetails }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            racquetValue,
            numberOfCracks,
            stringType,
            pickupPincode,
            customerDetails,
            racquetDetails,
        } = body

        // Calculate shipping cost
        const shippingResult = await calculateRoundTripShipping(pickupPincode)

        if (!shippingResult.success) {
            return NextResponse.json(
                { success: false, error: shippingResult.error || 'Shipping not available for this pincode' },
                { status: 400 }
            )
        }

        // Calculate complete pricing breakdown
        const breakdown = calculatePricingBreakdown(
            Number(racquetValue),
            Number(numberOfCracks),
            stringType || 'none',
            shippingResult.total || 0
        )

        // Create or update profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: customerDetails.email,
                full_name: customerDetails.name,
                phone: customerDetails.phone,
                address: customerDetails.address,
                pincode: pickupPincode,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (profileError) {
            console.error('Profile upsert error:', profileError)
        }

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_id: user.id,
                service_type: 'Frame Repair',
                status: 'Pickup_Pending',
                payment_status: 'pending',
                final_quote: breakdown.grandTotal,
            })
            .select()
            .single()

        if (orderError || !order) {
            return NextResponse.json(
                { success: false, error: 'Failed to create order' },
                { status: 500 }
            )
        }

        // Create racquet specs
        await supabase.from('racquet_specs').insert({
            order_id: order.id,
            brand: racquetDetails.brand,
            model: racquetDetails.model,
            string_type: stringType || null,
            tension_lbs: racquetDetails.tension || 24,
            knot_type: '4-knot',
        })

        // Generate PayU hash
        const merchantKey = process.env.PAYU_MERCHANT_KEY!
        const merchantSalt = process.env.PAYU_MERCHANT_SALT!

        const payuData = {
            key: merchantKey,
            txnid: `TXN${Date.now()}`,
            amount: breakdown.grandTotal.toString(),
            productinfo: `Racquet Repair - ${racquetDetails.brand} ${racquetDetails.model}`,
            firstname: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payu/verify`,
            furl: `${process.env.NEXT_PUBLIC_APP_URL}/book/failure`,
            udf1: order.id, // Store order ID
            udf2: breakdown.category, // Store pricing category
            udf3: numberOfCracks.toString(),
            udf4: stringType || 'none',
            udf5: pickupPincode,
            salt: merchantSalt,
        }

        const hash = generatePayUHash(payuData)

        // Remove salt before sending to client
        const { salt, ...payuDataForClient } = payuData

        return NextResponse.json({
            success: true,
            hash,
            payuData: payuDataForClient,
            breakdown,
            orderId: order.id,
        })
    } catch (error: any) {
        console.error('PayU create hash error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create payment hash' },
            { status: 500 }
        )
    }
}
