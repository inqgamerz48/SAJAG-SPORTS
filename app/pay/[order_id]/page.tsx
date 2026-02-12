'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'

export default function ManualPaymentPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.order_id as string

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [order, setOrder] = useState<any>(null)

    useEffect(() => {
        if (orderId) {
            fetchOrder()
        }
    }, [orderId])

    async function fetchOrder() {
        try {
            const res = await fetch(`/api/track-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, phone: 'PAYMENT_FLOW' }), // Special bypass for payment flow
            })
            const data = await res.json()
            if (data.success) {
                setOrder(data.order)
            } else {
                setError(data.error || 'Order not found')
            }
        } catch (err) {
            setError('Failed to load order details')
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!order) return
        setLoading(true)

        try {
            // Re-use the create-hash logic but for an existing order
            const response = await fetch('/api/payu/create-hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentData: {
                        serviceType: order.service_type,
                        name: order.customer_name,
                        email: order.customer_email,
                        phone: order.customer_phone,
                        address: order.address_line1,
                        // Add existing order ID to link it
                        existingOrderId: order.id
                    },
                    costBreakdown: {
                        total: order.final_quote || order.logistics_deposit || 0
                    }
                })
            })

            const data = await response.json()

            if (!data.success) throw new Error(data.error)

            const payuUrl = process.env.NEXT_PUBLIC_PAYU_ENV === 'prod'
                ? 'https://secure.payu.in/_payment'
                : 'https://test.payu.in/_payment'

            const form = document.createElement('form')
            form.method = 'POST'
            form.action = payuUrl

            const fields = {
                key: data.merchantKey,
                txnid: data.txnid,
                amount: data.amount,
                productinfo: data.productinfo,
                firstname: data.firstname,
                email: data.email,
                phone: order.customer_phone,
                surl: data.surl,
                furl: data.furl,
                hash: data.hash,
                udf1: order.id,
            }

            Object.entries(fields).forEach(([k, v]: [string, any]) => {
                const input = document.createElement('input')
                input.type = 'hidden'
                input.name = k
                input.value = v
                form.appendChild(input)
            })

            document.body.appendChild(form)
            form.submit()
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => router.push('/')} className="w-full">Back to Home</Button>
                </CardContent>
            </Card>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
            <Card className="max-w-lg w-full shadow-lg border-2">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Complete Your Payment</CardTitle>
                    <CardDescription>Order ID: {order.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 pb-4 border-b">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Service:</span>
                            <span className="font-semibold">{order.service_type === 'repair' ? 'Racquet Repair' : 'Racquet Stringing'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount Due:</span>
                            <span className="font-bold text-xl text-brand-orange">₹{order.final_quote || order.logistics_deposit}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-brand-orange hover:bg-brand-orange/90 h-12 text-lg"
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now
                    </Button>
                    <p className="text-center text-xs text-gray-400">Secure payment via PayU</p>
                </CardContent>
            </Card>
        </div>
    )
}
