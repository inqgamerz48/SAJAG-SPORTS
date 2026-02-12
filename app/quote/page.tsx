'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, Package, Wrench, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'

declare global {
    interface Window {
        Razorpay: any
    }
}

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

function QuoteContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState(true)
    const [calculating, setCalculating] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Get order details from URL params
    const racquetValue = searchParams.get('racquetValue')
    const numberOfCracks = searchParams.get('numberOfCracks')
    const stringType = searchParams.get('stringType') || 'none'
    const pickupPincode = searchParams.get('pickupPincode')
    const orderId = searchParams.get('orderId')

    const calculateQuote = useCallback(async () => {
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
    }, [racquetValue, numberOfCracks, stringType, pickupPincode])

    // Effect for calculating quote when params change
    useEffect(() => {
        if (racquetValue && numberOfCracks && pickupPincode) {
            calculateQuote()
        }
    }, [racquetValue, numberOfCracks, pickupPincode, calculateQuote])

    // Effect for loading Razorpay script
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)

        script.onload = () => {
            setLoading(false)
        }

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script)
            }
        }
    }, [])

    const handlePayment = async () => {
        if (!breakdown || !orderId) return

        setProcessing(true)
        setError(null)

        try {
            // Create Razorpay order
            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: breakdown.grandTotal,
                    orderId,
                    customerDetails: {
                        email: searchParams.get('email'),
                        phone: searchParams.get('phone'),
                    },
                }),
            })

            const orderData = await orderResponse.json()

            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to create payment order')
            }

            // Initialize Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Sajag Sports',
                description: 'Racquet Repair Service',
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    // Verify payment
                    try {
                        const verifyResponse = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_id: orderId,
                            }),
                        })

                        const verifyData = await verifyResponse.json()

                        if (verifyData.success) {
                            router.push(`/book/success?order_id=${orderId}`)
                        } else {
                            throw new Error('Payment verification failed')
                        }
                    } catch (err: any) {
                        setError(err.message || 'Payment verification failed')
                        setProcessing(false)
                    }
                },
                prefill: {
                    name: searchParams.get('name') || '',
                    email: searchParams.get('email') || '',
                    contact: searchParams.get('phone') || '',
                },
                theme: {
                    color: '#f97316', // Orange brand color
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false)
                    },
                },
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err: any) {
            setError(err.message || 'Payment failed')
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        )
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
                            disabled={processing}
                            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-6 text-lg font-bold"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    Proceed to Payment • {formatCurrency(breakdown.grandTotal)}
                                </>
                            )}
                        </Button>

                        <p className="text-center text-zinc-500 text-sm mt-4">
                            🔒 Secure payment powered by Razorpay
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

export default function QuotePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
        }>
            <QuoteContent />
        </Suspense>
    )
}
