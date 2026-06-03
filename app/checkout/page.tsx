'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Loader2, AlertCircle, ShoppingBag, MapPin, Truck, Tag } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useAuth } from '@/components/providers/auth-provider'

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => {
            open: () => void
        }
    }
}

interface CostBreakdown {
    serviceCost: number
    repairCost: number
    stringCost: number
    shippingCost: number
    legA: number
    legB: number
    subtotal: number
    total: number
    shippingMessage?: string
}

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotalPrice } = useCartStore()
    const { user, openAuthModal } = useAuth()

    // Auto-fill from whatever the user typed in the Stringing/Repair forms
    const primaryService = items.find(item => item.type === 'service')
    const [name, setName] = useState(primaryService?.customerName || '')
    const [email, setEmail] = useState(primaryService?.customerEmail || user?.email || '')
    const [phone, setPhone] = useState(primaryService?.customerPhone || '')
    const [pincode, setPincode] = useState(primaryService?.customerPincode || '')
    const [addressLine, setAddressLine] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')

    const [loading, setLoading] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Coupon State
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
    const [couponError, setCouponError] = useState<string | null>(null)
    const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

    // Wait for hydration
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return;

        if (items.length === 0) {
            router.push('/cart')
            return
        }

        if (!user) {
            openAuthModal()
            return
        }
    }, [items, mounted, user, router, openAuthModal])

    // Calculate quote whenever a valid Pincode has been entered
    useEffect(() => {
        if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
            const delayDebounceFn = setTimeout(() => {
                calculateCosts()
            }, 800)
            return () => clearTimeout(delayDebounceFn)
        } else {
            setCostBreakdown(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, pincode])

    const loadRazorpayScript = () =>
        new Promise<boolean>((resolve) => {
            if (window.Razorpay) {
                resolve(true)
                return
            }

            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.async = true
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })

    const calculateCosts = async () => {
        if (!pincode || pincode.length !== 6) return

        setCalculating(true)
        setError(null)

        try {
            // NOTE: /api/calculate-quote expects the `items` array to calculate shipping logistics
            const response = await fetch('/api/calculate-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items,
                    customerPincode: pincode
                }),
            })

            const result = await response.json()

            if (result.success && result.breakdown) {
                setCostBreakdown(result.breakdown)
                setError(null)
            } else {
                setError(result.error || 'Failed to calculate shipping total')
                setCostBreakdown(null)
            }
        } catch (err) {
            console.error('Error calculating costs:', err)
            setError('Failed to calculate shipping. Please try again.')
        } finally {
            setCalculating(false)
        }
    }

    const handlePayment = async () => {
        if (!addressLine.trim()) {
            setError('Please enter your complete delivery address.')
            return
        }
        if (!city.trim()) {
            setError('Please enter your city.')
            return
        }
        if (!state.trim()) {
            setError('Please enter your state.')
            return
        }
        if (!pincode || pincode.length !== 6) {
            setError('Please enter a valid 6-digit Pincode.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const sdkReady = await loadRazorpayScript()
            if (!sdkReady) {
                throw new Error('Unable to load Razorpay checkout. Please try again.')
            }

            const fullAddress = `${addressLine}, ${city}, ${state}, ${pincode}`

            // Adjust payload if coupon is applied
            const payloadCostBreakdown = costBreakdown ? { ...costBreakdown } : {
                subtotal: getTotalPrice(),
                total: getTotalPrice(),
                shippingCost: 0
            }

            if (appliedCoupon === 'sajagsports') {
                payloadCostBreakdown.shippingCost = 0
                // Recalculate total by removing original shipping
                if (costBreakdown) {
                    payloadCostBreakdown.total = payloadCostBreakdown.subtotal
                }
            }

            const payableTotal = payloadCostBreakdown.total

            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: payableTotal,
                    customerInfo: {
                        name,
                        email,
                        phone,
                        address: fullAddress,
                        pincode
                    },
                    pickupAddress: {
                        line1: addressLine,
                        city: city.trim(),
                        state: state.trim(),
                        pincode
                    },
                    items: items,
                    costBreakdown: payloadCostBreakdown,
                }),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to initialize payment')
            }

            const razorpayKey =
                data.razorpayKeyId ||
                process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

            if (!razorpayKey) {
                throw new Error('Razorpay key is not configured')
            }

            const razorpay = new window.Razorpay({
                key: razorpayKey,
                amount: data.amount,
                currency: data.currency || 'INR',
                name: 'Sajag Sports',
                description: 'Repair service payment',
                order_id: data.razorpayOrderId,
                prefill: {
                    name,
                    email,
                    contact: phone,
                },
                notes: {
                    orderId: data.orderId,
                },
                handler: async (paymentResponse: any) => {
                    try {
                        const verifyResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: data.orderId,
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_signature: paymentResponse.razorpay_signature,
                            }),
                        })

                        const verifyData = await verifyResponse.json()
                        if (!verifyData.success) {
                            throw new Error(verifyData.error || 'Payment verification failed')
                        }

                        // Clear cart state on success
                        useCartStore.getState().clearCart()

                        router.push(`/book/success?order_id=${data.orderId}`)
                    } catch (verifyError) {
                        setError(verifyError instanceof Error ? verifyError.message : 'Payment verification failed')
                        setLoading(false)
                    }
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
                theme: {
                    color: '#0f172a',
                },
            })

            razorpay.open()
        } catch (err) {
            console.error('Payment error:', err)
            setError(err instanceof Error ? err.message : 'Payment initialization failed')
            setLoading(false)
        }
    }

    const handleApplyCoupon = () => {
        setCouponError(null)
        setCouponSuccess(null)

        const code = couponCode.trim().toLowerCase()
        if (!code) return

        if (code === 'sajagsports') {
            const hasServices = items.some(item => item.type === 'service')
            const subtotal = getTotalPrice()

            if (hasServices) {
                setCouponError('Coupon not valid for service or repair orders.')
                return
            }

            if (subtotal < 700) {
                setCouponError('Order subtotal must be above ₹700 to use this coupon.')
                return
            }

            setAppliedCoupon('sajagsports')
            setCouponSuccess('Free shipping applied!')
        } else {
            setCouponError('Invalid coupon code.')
        }
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
        setCouponSuccess(null)
        setCouponError(null)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 pb-32">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Checkout</h1>
                    <p className="text-gray-500 mt-2">Confirm your delivery details and proceed to secure payment.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form & Items */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Delivery Address Form */}
                        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                            <CardHeader className="bg-white border-b border-gray-100">
                                <CardTitle className="flex items-center text-lg">
                                    <MapPin className="w-5 h-5 mr-3 text-brand-orange" />
                                    Delivery Details
                                </CardTitle>
                                <CardDescription>
                                    Your racquet will be picked up and delivered from this address.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 bg-white space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Full Name *</Label>
                                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Phone Number *</Label>
                                        <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Email Address *</Label>
                                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" required />
                                    </div>
                                    <div className="space-y-2 relative">
                                        <Label className="text-gray-700 flex justify-between">
                                            Pincode *
                                            {calculating && <Loader2 className="w-3 h-3 animate-spin text-brand-orange mt-1" />}
                                        </Label>
                                        <Input
                                            maxLength={6}
                                            value={pincode}
                                            onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="6-digit pincode"
                                            className={costBreakdown && !calculating ? 'border-green-500 bg-green-50' : ''}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Complete Address *</Label>
                                    <textarea
                                        className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                                        placeholder="House No., Building Name, Street, Landmark, Area..."
                                        value={addressLine}
                                        onChange={e => setAddressLine(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">City *</Label>
                                        <Input
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            placeholder="e.g. Pune"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">State *</Label>
                                        <Input
                                            value={state}
                                            onChange={e => setState(e.target.value)}
                                            placeholder="e.g. Maharashtra"
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items Summary */}
                        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                            <CardHeader className="bg-white border-b border-gray-100">
                                <CardTitle className="flex items-center text-lg">
                                    <ShoppingBag className="w-5 h-5 mr-3 text-brand-orange" />
                                    Order Items ({items.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 bg-white">
                                <ul className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <li key={item.id} className="p-5 flex gap-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-md shrink-0 flex items-center justify-center border border-gray-200 overflow-hidden relative">
                                                            {item.type === 'service' ? (
                                                                <div className="text-amber-500 font-bold text-[10px] uppercase text-center px-1">
                                                                    Service
                                                                </div>
                                                            ) : item.image ? (
                                                                <>
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                                                                </>
                                                            ) : (
                                                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                            {item.type === 'service' && (
                                                                <div className="text-sm text-gray-500 mt-1 flex gap-2 items-center flex-wrap">
                                                                    <Badge variant="outline" className="font-normal bg-white">
                                                                        {item.serviceType === 'repair' ? 'Repair' : 'Stringing'}
                                                                    </Badge>
                                                                    <span>{item.racquetBrand} {item.racquetModel}</span>
                                                                    {item.tension && <span>• {item.tension} lbs</span>}
                                                                </div>
                                                            )}
                                                            <div className="mt-1 text-sm text-gray-500">
                                                                Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-base font-bold text-gray-900 pt-1 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Pricing Engine & Checkout */}
                    <div className="lg:col-span-5">
                        <Card className="shadow-xl border-2 border-transparent bg-white sticky top-24 rounded-2xl overflow-hidden ring-1 ring-gray-200">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                                <CardTitle className="text-xl font-bold flex justify-between">
                                    Total Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">

                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Items Subtotal</span>
                                        <span className="font-medium text-gray-900">₹{getTotalPrice().toLocaleString()}</span>
                                    </div>

                                    {!pincode || pincode.length !== 6 ? (
                                        <div className="flex justify-between text-gray-500 pb-2">
                                            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Shipping</span>
                                            <span className="italic text-xs mt-0.5">Enter Pincode to calculate</span>
                                        </div>
                                    ) : calculating ? (
                                        <div className="flex justify-between text-gray-600 pb-2">
                                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-brand-orange" /> Calculating Shipping...</span>
                                            <span>--</span>
                                        </div>
                                    ) : costBreakdown ? (
                                        <>
                                            {costBreakdown.shippingCost > 0 ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-sm text-gray-500 pl-2 border-l-2 border-gray-200">
                                                        <span>Pickup Journey</span>
                                                        <span>₹{costBreakdown.legA.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-gray-500 pl-2 border-l-2 border-gray-200">
                                                        <span>Return Journey</span>
                                                        <span>₹{costBreakdown.legB.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-medium text-gray-900 pt-1 pb-2 items-center">
                                                        <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-brand-orange" /> Total Shipping</span>
                                                        <div className="flex flex-col items-end">
                                                            {appliedCoupon === 'sajagsports' ? (
                                                                <>
                                                                    <span className="line-through text-gray-400 text-sm">₹{costBreakdown.shippingCost.toFixed(2)}</span>
                                                                    <span className="text-green-600 font-bold">Free</span>
                                                                </>
                                                            ) : (
                                                                <span>₹{costBreakdown.shippingCost.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between font-medium text-green-600 pb-2">
                                                    <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Shipping</span>
                                                    <span>Free</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex justify-between text-red-500 pb-2">
                                            <span>Shipping</span>
                                            <span className="text-sm">Unavailable for Pincode</span>
                                        </div>
                                    )}
                                </div>

                                {costBreakdown?.shippingMessage && (
                                    <div className="rounded-lg bg-blue-50/80 p-3 text-xs text-blue-800 border border-blue-100 flex gap-2">
                                        <div className="mt-0.5 whitespace-pre-wrap">{costBreakdown.shippingMessage}</div>
                                    </div>
                                )}

                                <Separator className="bg-gray-200" />

                                {/* Coupon Section */}
                                <div className="space-y-3 pb-2">
                                    <Label className="text-gray-700 flex items-center gap-2"><Tag className="w-4 h-4 text-brand-orange" /> Coupon Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            disabled={appliedCoupon !== null || calculating}
                                            className="uppercase"
                                        />
                                        {appliedCoupon ? (
                                            <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleRemoveCoupon}>
                                                Remove
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode || calculating || items.length === 0}>
                                                Apply
                                            </Button>
                                        )}
                                    </div>

                                    {couponSuccess && (
                                        <p className="text-sm text-green-600 flex items-center gap-1">
                                            ✓ {couponSuccess}
                                        </p>
                                    )}
                                    {couponError && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {couponError}
                                        </p>
                                    )}
                                </div>

                                <Separator className="bg-gray-200" />

                                <div className="flex justify-between items-end pt-2">
                                    <div className="space-y-1">
                                        <span className="block text-lg font-bold text-gray-900">Total Amount</span>
                                        <span className="block text-xs text-gray-500">Including all taxes</span>
                                    </div>
                                    <span className="text-3xl font-black text-brand-orange tracking-tight">
                                        ₹{costBreakdown
                                            ? (appliedCoupon === 'sajagsports' ? costBreakdown.subtotal : costBreakdown.total).toLocaleString()
                                            : getTotalPrice().toLocaleString()}
                                    </span>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-sm mt-4">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button
                                        onClick={handlePayment}
                                        disabled={loading || calculating || !addressLine.trim() || !city.trim() || !state.trim() || !pincode || (pincode.length === 6 && !costBreakdown && !error)}
                                        className="w-full h-14 text-lg font-bold bg-black hover:bg-gray-800 text-white rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-500"
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center relative overflow-hidden">
                                                <CreditCard className="w-5 h-5 mr-2" />
                                                Pay Securely
                                                <div className="absolute inset-0 h-full w-full bg-white/20 skew-x-12 translate-x-[-150%] transition-transform duration-1000 group-hover:translate-x-[150%]"></div>
                                            </span>
                                        )}
                                    </Button>
                                    <p className="text-center text-xs text-gray-400 font-medium pt-4 pb-1">
                                        Payments processed securely by Razorpay
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
