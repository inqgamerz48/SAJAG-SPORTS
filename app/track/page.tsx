'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, Package, CheckCircle2, Clock, XCircle, Truck, MapPin, AlertCircle, Sparkles } from 'lucide-react'

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
    courier_name?: string
    tension_lbs?: number
    string_name?: string
}

// Visual step definition matching all core lifecycles and fallback states
const steps = [
    { id: "Pending", label: "Order Confirmed", icon: CheckCircle2 },
    { id: "Manual_Fulfillment_Required", label: "Manual Collection Arranged", icon: AlertCircle },
    { id: "Return_Created", label: "Return Created", icon: Package },
    { id: "Pickup_Pending", label: "Pickup Arranged", icon: Truck },
    { id: "In_Workshop", label: "Arrived at Workshop", icon: MapPin },
    { id: "Repairing", label: "Under Repair", icon: AlertCircle },
    { id: "Ready_to_Return", label: "Repair Completed", icon: Sparkles },
    { id: "Shipped", label: "Shipped Back", icon: Truck },
    { id: "Completed", label: "Delivered", icon: CheckCircle2 }
]

const storeSteps = [
    { id: "Pending", label: "Order Confirmed", icon: CheckCircle2 },
    { id: "Processing", label: "Processing", icon: Clock },
    { id: "Shipped", label: "Shipped", icon: Truck },
    { id: "Completed", label: "Delivered", icon: CheckCircle2 }
]

const friendlyDescriptions: Record<string, string> = {
    Pending: "Your repair/stringing order has been confirmed. Payment captured successfully.",
    Manual_Fulfillment_Required: "We are coordinating your pickup manually. Our support team will contact you shortly.",
    Return_Created: "Return shipment order created. Awaiting courier allocation.",
    Pickup_Pending: "Pickup is scheduled. Please keep the racquet packed and ready for collection.",
    In_Workshop: "Your racquet has arrived safely at our workshop and is currently in processing.",
    Repairing: "Our master technicians are currently working on your racquet.",
    Ready_to_Return: "Repair work completed successfully! The racquet passed quality control checks.",
    Shipped: "Your racquet has been shipped back to your address. AWB tracking is active.",
    Completed: "Your racquet has been delivered safely. Thank you for choosing Sajag Sports!",
    Cancelled: "This order has been cancelled."
}

const friendlyStoreDescriptions: Record<string, string> = {
    Pending: "Your store order has been confirmed successfully! We are preparing your items for delivery.",
    Processing: "We are processing your order and preparing it for shipment.",
    Shipped: "Your package has been handed over to our courier partner. AWB tracking is active.",
    Completed: "Your order has been delivered successfully. Thank you for shopping with Sajag Sports!",
    Cancelled: "This order has been cancelled."
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

    const isStoreOrder = order && (order.service_type === 'Products Only' || order.service_type === 'store' || order.service_type === 'physical')

    let activeSteps = steps
    let currentStepIndex = -1

    if (order) {
        if (isStoreOrder) {
            activeSteps = storeSteps
            if (order.status === 'Pending') {
                currentStepIndex = 0
            } else if (order.status === 'Shipped') {
                currentStepIndex = 2
            } else if (order.status === 'Completed') {
                currentStepIndex = 3
            } else if (order.status === 'Cancelled') {
                currentStepIndex = -1
            } else {
                currentStepIndex = 1 // Processing intermediate state
            }
        } else {
            currentStepIndex = steps.findIndex(s => s.id === order.status)
        }
    }

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            Pending: 'Order Confirmed',
            Manual_Fulfillment_Required: 'Manual Collection Required',
            Return_Created: 'Return Created',
            Pickup_Pending: 'Awaiting Pickup',
            In_Workshop: 'Arrived at Workshop',
            Repairing: 'Under Repair',
            Ready_to_Return: 'QC Passed & Ready to Return',
            Shipped: isStoreOrder ? 'Shipped' : 'Shipped Back',
            Completed: 'Delivered',
            Cancelled: 'Cancelled'
        }
        
        if (isStoreOrder && !['Pending', 'Shipped', 'Completed', 'Cancelled'].includes(status)) {
            return 'Processing'
        }

        return statusMap[status] || status.replace('_', ' ')
    }

    const getDescriptionText = () => {
        if (!order) return ''
        if (isStoreOrder) {
            if (['Pending', 'Shipped', 'Completed', 'Cancelled'].includes(order.status)) {
                return friendlyStoreDescriptions[order.status]
            }
            return friendlyStoreDescriptions.Processing
        }
        return friendlyDescriptions[order.status] || friendlyDescriptions.Pending
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
                        Track <span className="text-lime-500">{order && isStoreOrder ? 'Your Order' : 'Your Repair'}</span>
                    </h1>
                    <p className="mt-4 text-zinc-400 text-lg">
                        {order && isStoreOrder
                            ? "Enter your Order ID and phone number to trace your shipment in real-time."
                            : "Enter your Order ID and phone number to trace your racquet's repair lifecycle in real-time."}
                    </p>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Order Search</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Provide search details below to access current repair and logistics status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTrack} className="space-y-4">
                            <div>
                                <Label htmlFor="orderId" className="text-zinc-300">Order ID</Label>
                                <Input
                                    id="orderId"
                                    type="text"
                                    placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
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
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
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
                                className="w-full bg-lime-500 hover:bg-lime-600 text-zinc-900 font-bold"
                            >
                                {loading ? (
                                    <>
                                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                                        Fetching details...
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
                    <Card className="mt-8 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl">
                        <CardHeader className="border-b border-zinc-800">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-white">Order Details</CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        {order.service_type === 'repair' 
                                            ? 'Frame Repair Service' 
                                            : order.service_type === 'stringing' 
                                                ? 'Stringing Service' 
                                                : 'Store Purchase'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-zinc-800/80 rounded-lg border border-zinc-700">
                                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Status:</span>
                                    <span className="text-sm font-bold text-lime-400">{getStatusText(order.status)}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-zinc-500 text-sm">Customer Name</p>
                                    <p className="text-white font-semibold text-base mt-0.5">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm">Order Placed Date</p>
                                    <p className="text-white font-semibold text-base mt-0.5">
                                        {new Date(order.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                {order.racquet_brand && order.racquet_model && (
                                    <div className="sm:col-span-2">
                                        <p className="text-zinc-500 text-sm">Racquet Details</p>
                                        <p className="text-white font-semibold text-base mt-0.5">
                                            {order.racquet_brand} {order.racquet_model}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Friendly Explanations box */}
                            <div className="p-4 bg-lime-500/5 rounded-xl border border-lime-500/10">
                                <p className="text-sm text-lime-400/90 font-medium">
                                    {getDescriptionText()}
                                </p>
                            </div>

                            {/* Action Required: Payment Capture Card */}
                            {order.payment_status === 'pending' && (order.final_quote || order.logistics_deposit) && (
                                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Payment Required</p>
                                        <p className="text-white font-bold text-xl mt-0.5">₹{order.final_quote || order.logistics_deposit}</p>
                                    </div>
                                    <Button
                                        onClick={() => router.push(`/pay/${order.id}`)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md"
                                    >
                                        Proceed to Pay
                                    </Button>
                                </div>
                            )}

                            {/* Racquet Specifications (Tension, String Type) */}
                            {(order.string_name || order.tension_lbs) && (
                                <div className="p-4 bg-zinc-800/20 rounded-xl border border-zinc-800/80">
                                    <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold mb-3">Racquet Specifications</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {order.string_name && (
                                            <div>
                                                <span className="text-zinc-500">String:</span>
                                                <span className="text-white font-semibold ml-1.5">{order.string_name}</span>
                                            </div>
                                        )}
                                        {order.tension_lbs && (
                                            <div>
                                                <span className="text-zinc-500">Tension:</span>
                                                <span className="text-white font-semibold ml-1.5">{order.tension_lbs} lbs</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Shipment Details (Courier, AWB) */}
                            {(order.waybill || order.shiprocket_awb_code) && (
                                <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Shipment Details</p>
                                        {order.courier_name && (
                                            <p className="text-zinc-300 text-sm">
                                                Courier: <span className="text-white font-semibold">{order.courier_name}</span>
                                            </p>
                                        )}
                                        <p className="text-zinc-400 text-sm">
                                            AWB: <span className="text-white font-mono font-bold">{order.waybill || order.shiprocket_awb_code}</span>
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="border-zinc-700 text-lime-400 hover:bg-zinc-800 font-semibold"
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
                            )}

                            {/* Step Timeline */}
                            <div className="pt-6 border-t border-zinc-800">
                                <p className="text-zinc-500 text-sm font-semibold mb-6">
                                    {isStoreOrder ? 'Delivery Progress Timeline' : 'Service Progress Timeline'}
                                </p>
                                <div className="relative pl-6 space-y-6">
                                    {/* Vertical Line */}
                                    <div className="absolute left-9 top-3 bottom-3 w-0.5 bg-zinc-800" />

                                    {activeSteps.map((step, index) => {
                                        const isCompleted = currentStepIndex >= index && currentStepIndex !== -1
                                        const isCurrent = currentStepIndex === index
                                        const Icon = step.icon

                                        // Hide Manual Collection stage if the status doesn't match and order progress is past it
                                        if (step.id === 'Manual_Fulfillment_Required' && order.status !== 'Manual_Fulfillment_Required') {
                                            return null
                                        }

                                        return (
                                            <div key={step.id} className="relative flex items-start gap-4">
                                                {/* Node Circle */}
                                                <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 border-zinc-950 transition-all duration-300
                                                    ${isCompleted 
                                                        ? 'bg-lime-500 text-zinc-950 shadow-[0_0_8px_rgba(132,204,22,0.3)]' 
                                                        : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                                                    }
                                                `}>
                                                    <Icon className="w-4 h-4" />
                                                </div>

                                                {/* Text Label */}
                                                <div className="flex-1 pt-1">
                                                    <h3 className={`text-base font-semibold transition-all duration-300
                                                        ${isCompleted ? 'text-white' : 'text-zinc-600'}
                                                    `}>
                                                        {step.label}
                                                    </h3>
                                                    {isCurrent && (
                                                        <p className="text-xs text-lime-400 mt-0.5">
                                                            Currently in this phase.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
