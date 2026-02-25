import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Package, Truck, CheckCircle2, AlertCircle, Wrench, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getStatusColor(status: string) {
    switch (status) {
        case 'Pending':
        case 'Pickup_Pending':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'In_Workshop':
        case 'Repairing':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'Ready_to_Return':
        case 'Shipped':
            return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'Delivered':
        case 'Completed':
            return 'bg-green-100 text-green-800 border-green-200'
        case 'Cancelled':
            return 'bg-red-100 text-red-800 border-red-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'Pending': return 'Order Received'
        case 'Pickup_Pending': return 'Awaiting Pickup'
        case 'In_Workshop': return 'Received at Workshop'
        case 'Repairing': return 'Being Serviced'
        case 'Ready_to_Return': return 'Ready for Dispatch'
        case 'Shipped': return 'Dispatched'
        case 'Completed':
        case 'Delivered': return 'Delivered'
        case 'Cancelled': return 'Cancelled'
        default: return status.replace(/_/g, ' ')
    }
}

function StatusTracker({ currentStatus }: { currentStatus: string }) {
    const steps = [
        { key: 'Pending', label: 'Received' },
        { key: 'Repairing', label: 'Being Serviced' },
        { key: 'Shipped', label: 'Dispatched' },
        { key: 'Completed', label: 'Delivered' },
    ]

    let currentStepIndex = 0
    if (['In_Workshop', 'Repairing', 'Ready_to_Return'].includes(currentStatus)) currentStepIndex = 1
    if (['Shipped'].includes(currentStatus)) currentStepIndex = 2
    if (['Completed', 'Delivered'].includes(currentStatus)) currentStepIndex = 3

    if (currentStatus === 'Cancelled') {
        return (
            <div className="flex items-center text-red-500 font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                This order was cancelled.
            </div>
        )
    }

    return (
        <div className="relative pt-4 w-full">
            <div className="absolute top-6 left-2 right-2 h-1 bg-slate-100 rounded-full z-0 overflow-hidden">
                <div
                    className="h-full bg-brand-orange transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
            </div>
            <div className="relative z-10 flex justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex

                    return (
                        <div key={step.key} className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 mb-2 transition-colors duration-300 ${isCompleted ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className={`text-[10px] md:text-xs font-semibold ${isCurrent ? 'text-brand-blue' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default async function ProfilePage() {
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
        redirect('/?login=true')
    }

    // Fetch user's profile and orders from Prisma
    const [profile, orders] = await Promise.all([
        prisma.profile.findUnique({
            where: { id: user.id }
        }),
        prisma.order.findMany({
            where: { customerId: user.id },
            include: { orderItems: true, shipments: true },
            orderBy: { createdAt: 'desc' }
        })
    ])

    const displayName = profile?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || 'User'

    const serviceOrders = orders.filter(o => o.orderItems.some(i => i.serviceType))
    const productOrders = orders.filter(o => o.orderItems.some(i => i.productId && !i.serviceType))

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 pt-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-blue tracking-tight">Welcome, {displayName.split(' ')[0]}</h1>
                    <p className="text-slate-500 mt-2">Manage your racquet repairs and shop orders.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* SERVICE HISTORY */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-brand-orange" />
                            <h2 className="text-xl font-bold">Service History</h2>
                        </div>

                        {serviceOrders.length === 0 ? (
                            <Card className="border-dashed border-2 shadow-none bg-transparent">
                                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                    <Wrench className="w-10 h-10 text-slate-300 mb-4" />
                                    <h3 className="font-semibold text-slate-700">No services yet</h3>
                                    <p className="text-sm text-slate-500 mb-4">Book a racquet repair or stringing service.</p>
                                    <Button variant="outline" asChild>
                                        <Link href="/book">Book Service</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {serviceOrders.map((order) => (
                                    <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="bg-slate-50/50 pb-4 border-b">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base font-bold text-brand-blue mb-1">
                                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                                    {getStatusLabel(order.status)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                {/* Iterate Order Items */}
                                                {order.orderItems.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold text-slate-900 capitalize">
                                                                {item.serviceType === 'repair' ? 'Crack Repair' : 'Restringing'}
                                                            </p>
                                                            <p className="text-sm text-slate-500">
                                                                {item.racquetBrand} {item.racquetModel} {item.tensionLbs ? `• ${item.tensionLbs} lbs` : ''}
                                                            </p>
                                                        </div>
                                                        <span className="font-bold text-slate-700">₹{item.priceAtPurchase.toString()}</span>
                                                    </div>
                                                ))}

                                                <Separator />

                                                <StatusTracker currentStatus={order.status} />

                                                {order.shipments.length > 0 && order.shipments[0].awbCode && (
                                                    <div className="mt-4 pt-4 border-t border-dashed bg-slate-50 -mx-6 px-6 pb-2 text-sm flex items-center justify-between text-slate-500">
                                                        <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Tracking AWB:</span>
                                                        <span className="font-mono font-medium text-slate-800">{order.shipments[0].awbCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ORDER HISTORY */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-brand-orange" />
                            <h2 className="text-xl font-bold">Order History</h2>
                        </div>

                        {productOrders.length === 0 ? (
                            <Card className="border-dashed border-2 shadow-none bg-transparent">
                                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                    <Package className="w-10 h-10 text-slate-300 mb-4" />
                                    <h3 className="font-semibold text-slate-700">No shop orders</h3>
                                    <p className="text-sm text-slate-500 mb-4">Explore our selection of premium gear.</p>
                                    <Button variant="outline" asChild>
                                        <Link href="/shop">Visit Store Front</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {productOrders.map((order) => (
                                    <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="bg-slate-50/50 pb-4 border-b">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base font-bold text-brand-blue mb-1">
                                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                                    {getStatusLabel(order.status)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                {/* Iterate Order Items */}
                                                {order.orderItems.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900">
                                                                    Product ID: {item.productId?.slice(0, 8)}...
                                                                </p>
                                                                <p className="text-sm text-slate-500">
                                                                    Qty: {item.quantity}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-slate-700">₹{item.priceAtPurchase.toString()}</span>
                                                    </div>
                                                ))}

                                                <Separator />

                                                <StatusTracker currentStatus={order.status} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
