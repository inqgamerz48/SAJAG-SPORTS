import { NextRequest, NextResponse } from 'next/server'
import { generatePayUHash } from '@/lib/payu'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            customerInfo,
            items,
            costBreakdown
        } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
        }

        if (!customerInfo || !costBreakdown) {
            return NextResponse.json({ success: false, error: 'Missing customer info or pricing breakdown' }, { status: 400 })
        }

        const grandTotal = costBreakdown.total
        const isRoundTrip = items.some((item: any) => item.type === 'service')

        // 0. Ensure Profile Exists (Bypass flaky Supabase triggers for OAuth users)
        await prisma.profile.upsert({
            where: { id: user.id },
            update: {
                fullName: customerInfo.name,
                phone: customerInfo.phone,
                address: customerInfo.address,
                pincode: customerInfo.pincode
            },
            create: {
                id: user.id,
                email: user.email || customerInfo.email,
                fullName: customerInfo.name,
                phone: customerInfo.phone,
                address: customerInfo.address,
                pincode: customerInfo.pincode
            }
        })

        // 1. Create Order in Prisma
        const order = await prisma.order.create({
            data: {
                customerId: user.id,
                status: 'Pending',
                paymentStatus: 'pending',
                finalQuote: grandTotal,
                orderItems: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        quantity: item.quantity,
                        priceAtPurchase: item.price,
                        serviceType: item.serviceType || null,
                        racquetBrand: item.racquetBrand || null,
                        racquetModel: item.racquetModel || null,
                        tensionLbs: item.tension || null
                    }))
                },
                shipments: {
                    create: {
                        provider: 'delhivery',
                        isReverse: isRoundTrip
                    }
                }
            }
        })

        // 2. Generate PayU object
        const merchantKey = process.env.PAYU_MERCHANT_KEY!
        const merchantSalt = process.env.PAYU_MERCHANT_SALT!

        const productName = items.length === 1
            ? items[0].name
            : `${items.length} items (Mixed)`

        const payuData = {
            key: merchantKey,
            txnid: `TXN${Date.now()}`,
            amount: grandTotal.toString(),
            productinfo: productName,
            firstname: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payu/verify`,
            furl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`, // Return to cart on failure
            udf1: order.id, // Critical: pass the real Prisma order ID
            salt: merchantSalt,
        }

        const hash = generatePayUHash(payuData)

        // Remove salt before returning
        const { salt, ...payuDataForClient } = payuData

        return NextResponse.json({
            success: true,
            hash,
            payuData: payuDataForClient,
            orderId: order.id
        })
    } catch (error: any) {
        console.error('PayU create hash error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create payment hash' },
            { status: 500 }
        )
    }
}
