'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, Package, CheckCircle2, Clock, XCircle, Truck } from 'lucide-react'

interface OrderStatus {
    id: string
    service_type: string
    status: string
    created_at: string
    waybill?: string
    shiprocket_awb_code?: string // Keep for backward compatibility
    racquet_brand?: string
    racquet_model?: string
    customer_name: string
    final_quote?: number
    logistics_deposit?: number
    payment_status?: string
}

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState<OrderStatus | null>(null)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setOrder(null)

        try {
            const response = await fetch('/api/track-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, phone }),
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Order not found')
                return
            }

            setOrder(data.order)
        } catch (err) {
            setError('Failed to fetch order details. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pickup_Pending':
                return <Clock className="w-6 h-6 text-yellow-500" />
            case 'In_Workshop':
                return <Package className="w-6 h-6 text-blue-500" />
            case 'Repairing':
                return <Truck className="w-6 h-6 text-orange-500" />
            case 'Ready_to_Return':
                return <Package className="w-6 h-6 text-green-500" />
            case 'Completed':
                return <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            default:
                return <Clock className="w-6 h-6 text-gray-500" />
        }
    }

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            Pickup_Pending: 'Awaiting Pickup from Your Location',
            In_Workshop: 'Arrived at Sajag Workshop',
            Repairing: 'Under Selection/Repair (In Progress)',
            Ready_to_Return: 'Repair Completed - QC Passed',
            Completed: 'Returned & Delivered',
        }
        return statusMap[status] || status.replace('_', ' ')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Track Your Order</h1>
                    <p className="text-zinc-400">Enter your order details to check the status</p>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Order Tracking</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Enter your Order ID and phone number to track your repair or stringing service
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTrack} className="space-y-4">
                            <div>
                                <Label htmlFor="orderId" className="text-zinc-300">Order ID</Label>
                                <Input
                                    id="orderId"
                                    type="text"
                                    placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone" className="text-zinc-300">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="e.g., 9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-lime-500 hover:bg-lime-600 text-zinc-900 font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                                        Tracking...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Track Order
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {order && (
                    <Card className="mt-6 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white">Order Details</CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        {order.service_type === 'repair' ? 'Repair Service' : 'Stringing Service'}
                                    </CardDescription>
                                </div>
                                {getStatusIcon(order.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-zinc-500 text-sm">Customer Name</p>
                                    <p className="text-white font-medium">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm">Order Date</p>
                                    <p className="text-white font-medium">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {order.racquet_brand && order.racquet_model && (
                                <div>
                                    <p className="text-zinc-500 text-sm">Racquet</p>
                                    <p className="text-white font-medium">
                                        {order.racquet_brand} {order.racquet_model}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-zinc-800">
                                <p className="text-zinc-500 text-sm mb-2">Current Status</p>
                                <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                                    {getStatusIcon(order.status)}
                                    <p className="text-white font-medium">{getStatusText(order.status)}</p>
                                </div>
                            </div>

                            {order.payment_status === 'pending' && (order.final_quote || order.logistics_deposit) && (
                                <div className="pt-4 border-t border-zinc-800">
                                    <p className="text-zinc-500 text-sm mb-2">Payment Required</p>
                                    <div className="flex items-center justify-between p-3 bg-brand-orange/10 rounded-lg border border-brand-orange/20">
                                        <div>
                                            <p className="text-zinc-300 text-xs">Amount Due</p>
                                            <p className="text-white font-bold text-lg">₹{order.final_quote || order.logistics_deposit}</p>
                                        </div>
                                        <Button
                                            onClick={() => router.push(`/pay/${order.id}`)}
                                            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                                        >
                                            Pay Now
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {(order.waybill || order.shiprocket_awb_code) && (
                                <div className="pt-4 border-t border-zinc-800">
                                    <p className="text-zinc-500 text-sm mb-2">Tracking Information</p>
                                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                                        <p className="text-zinc-400 text-sm">{order.waybill ? 'Waybill' : 'AWB Code'}</p>
                                        <p className="text-white font-mono font-medium">{order.waybill || order.shiprocket_awb_code}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 border-zinc-700 text-lime-500 hover:bg-zinc-800"
                                            onClick={() => {
                                                const trackingUrl = order.waybill
                                                    ? `https://www.shiprocket.com/track/package/${order.waybill}`
                                                    : `https://shiprocket.co/tracking/${order.shiprocket_awb_code}`
                                                window.open(trackingUrl, '_blank')
                                            }}
                                        >
                                            <Truck className="w-4 h-4 mr-2" />
                                            Track Shipment
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
