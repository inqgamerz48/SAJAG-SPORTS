'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, Package, Wrench, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'

interface PricingBreakdown {
    repairCost: number
    repairRate: number
    numberOfCracks: number
    category: 'A' | 'B'
    stringCost: number
    stringName: string
    shippingCost: number
    shippingGst: number
    subtotal: number
    grandTotal: number
    shippingBreakdown?: {
        legA: number
        legB: number
    }
}

function PayUQuoteContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Get order details from URL params
    const racquetValue = searchParams.get('racquetValue')
    const numberOfCracks = searchParams.get('numberOfCracks')
    const stringType = searchParams.get('stringType') || 'none'
    const pickupPincode = searchParams.get('pickupPincode')
    const name = searchParams.get('name')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const address = searchParams.get('address')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const tension = searchParams.get('tension')

    useEffect(() => {
        if (racquetValue && numberOfCracks && pickupPincode) {
            calculateQuote()
        }
    }, [])

    const calculateQuote = async () => {
        setCalculating(true)
        setError(null)

        try {
            const response = await fetch('/api/calculate-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    racquetValue: Number(racquetValue),
                    numberOfCracks: Number(numberOfCracks),
                    stringType,
                    pickupPincode,
                }),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to calculate quote')
            }

            setBreakdown(data.breakdown)
        } catch (err: any) {
            setError(err.message || 'Failed to calculate quote')
        } finally {
            setCalculating(false)
        }
    }

    const handlePayment = async () => {
        if (!breakdown) return

        setLoading(true)
        setError(null)

        try {
            // Create PayU hash
            const hashResponse = await fetch('/api/payu/create-hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    racquetValue: Number(racquetValue),
                    numberOfCracks: Number(numberOfCracks),
                    stringType,
                    pickupPincode,
                    customerDetails: {
                        name,
                        email,
                        phone,
                        address,
                    },
                    racquetDetails: {
                        brand,
                        model,
                        tension: Number(tension) || 24,
                    },
                }),
            })

            const hashData = await hashResponse.json()

            if (!hashData.success) {
                throw new Error(hashData.error || 'Failed to create payment')
            }

            // Submit PayU form
            const payuUrl = process.env.NEXT_PUBLIC_PAYU_ENV === 'prod'
                ? 'https://secure.payu.in/_payment'
                : 'https://test.payu.in/_payment'

            const form = document.createElement('form')
            form.method = 'POST'
            form.action = payuUrl

            Object.entries(hashData.payuData).forEach(([key, value]) => {
                const input = document.createElement('input')
                input.type = 'hidden'
                input.name = key
                input.value = value as string
                form.appendChild(input)
            })

            const hashInput = document.createElement('input')
            hashInput.type = 'hidden'
            hashInput.name = 'hash'
            hashInput.value = hashData.hash
            form.appendChild(hashInput)

            document.body.appendChild(form)
            form.submit()
        } catch (err: any) {
            setError(err.message || 'Payment failed')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Your Quote</h1>
                    <p className="text-zinc-400">Review pricing and proceed to payment</p>
                </div>

                {error && (
                    <Card className="bg-red-500/10 border-red-500/20 mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {calculating ? (
                    <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-3 text-zinc-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <p>Calculating quote with real-time shipping...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : breakdown ? (
                    <>
                        {/* Pricing Summary Card */}
                        <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Package className="w-5 h-5 text-brand-orange" />
                                    Pricing Breakdown
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Transparent pricing with no hidden charges
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Repair Charges */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Wrench className="w-5 h-5 text-blue-400 mt-1" />
                                        <div>
                                            <p className="text-white font-medium">Repair Charges</p>
                                            <p className="text-sm text-zinc-400">
                                                Category {breakdown.category} • {formatCurrency(breakdown.repairRate)} × {breakdown.numberOfCracks} crack{breakdown.numberOfCracks > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-white font-bold">{formatCurrency(breakdown.repairCost)}</p>
                                </div>

                                <Separator className="bg-zinc-700" />

                                {/* Stringing Material */}
                                {breakdown.stringCost > 0 && (
                                    <>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <Package className="w-5 h-5 text-green-400 mt-1" />
                                                <div>
                                                    <p className="text-white font-medium">Stringing Material</p>
                                                    <p className="text-sm text-zinc-400">{breakdown.stringName}</p>
                                                </div>
                                            </div>
                                            <p className="text-white font-bold">{formatCurrency(breakdown.stringCost)}</p>
                                        </div>
                                        <Separator className="bg-zinc-700" />
                                    </>
                                )}

                                {/* Logistics & Handling */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Truck className="w-5 h-5 text-purple-400 mt-1" />
                                        <div>
                                            <p className="text-white font-medium">Logistics & Handling</p>
                                            <p className="text-sm text-zinc-400">
                                                Delhivery Round-Trip • 2.0 kg • Fragile
                                            </p>
                                            {breakdown.shippingBreakdown && (
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    Pickup: {formatCurrency(breakdown.shippingBreakdown.legA)} • Return: {formatCurrency(breakdown.shippingBreakdown.legB)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-white font-bold">{formatCurrency(breakdown.shippingCost)}</p>
                                </div>

                                <Separator className="bg-zinc-700" />

                                {/* GST on Shipping */}
                                <div className="flex items-center justify-between">
                                    <p className="text-zinc-400 text-sm">GST on Shipping (18%)</p>
                                    <p className="text-zinc-300 font-medium">{formatCurrency(breakdown.shippingGst)}</p>
                                </div>

                                <Separator className="bg-zinc-700" />

                                {/* Grand Total */}
                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <p className="text-white text-xl font-bold">Grand Total</p>
                                        <p className="text-zinc-400 text-sm">All charges included</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-brand-orange text-3xl font-bold">{formatCurrency(breakdown.grandTotal)}</p>
                                        <Badge variant="outline" className="mt-1 border-green-500/20 text-green-400">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Fragile Handling
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Button */}
                        <Button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-6 text-lg font-bold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Redirecting to PayU...
                                </>
                            ) : (
                                <>
                                    Proceed to Payment • {formatCurrency(breakdown.grandTotal)}
                                </>
                            )}
                        </Button>

                        <p className="text-center text-zinc-500 text-sm mt-4">
                            🔒 Secure payment powered by PayU
                        </p>
                    </>
                ) : (
                    <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardContent className="pt-6">
                            <p className="text-zinc-400 text-center">No order details found. Please start from the booking form.</p>
                            <Button
                                onClick={() => router.push('/book')}
                                variant="outline"
                                className="w-full mt-4 border-zinc-700 text-white hover:bg-zinc-800"
                            >
                                Go to Booking Form
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default function PayUQuotePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        }>
            <PayUQuoteContent />
        </Suspense>
    )
}
