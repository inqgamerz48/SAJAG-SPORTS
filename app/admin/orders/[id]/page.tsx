import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Package,
    Truck,
    CreditCard,
    Clock,
    CheckCircle2,
    Wrench,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import OrderStatusUpdater from '@/components/admin/order-status-updater'

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: order, error } = await supabase
        .from('orders')
        .select('*, media_evidence(*)')
        .eq('id', id)
        .single()

    if (error || !order) {
        notFound()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'analyzing': return 'bg-blue-100 text-blue-700'
            case 'approved_for_pickup': return 'bg-orange-100 text-orange-700'
            case 'pickup_scheduled': return 'bg-yellow-100 text-yellow-700'
            case 'in_repair': return 'bg-purple-100 text-purple-700'
            case 'ready_for_delivery': return 'bg-green-100 text-green-700'
            case 'delivered': return 'bg-slate-100 text-slate-700'
            case 'rejected': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className="text-slate-500">
                    <Link href="/admin/orders"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders</Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
                        <Badge className={`font-bold border-none ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                    <p className="text-slate-500">Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Truck className="h-4 w-4" /> TRACK SHIPMENT
                    </Button>
                    <Button className="bg-brand-blue gap-2">
                        PRINT LABEL
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Section 1: Customer & Address */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card title="Customer Information" icon={<Users className="h-5 w-5 text-brand-blue" />}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                        {order.customer_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{order.customer_name}</p>
                                        <p className="text-xs text-slate-500">Customer ID: {order.user_id?.slice(0, 8) || 'Guest'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        {order.customer_phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        {order.customer_email}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Pickup Address" icon={<MapPin className="h-5 w-5 text-brand-orange" />}>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p className="font-medium text-slate-900">{order.address_line1}</p>
                                {order.address_line2 && <p>{order.address_line2}</p>}
                                <p>{order.city}, {order.state}</p>
                                <p className="font-bold text-slate-900 mt-2">{order.pincode}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Section 2: Racquet Details */}
                    <Card title="Racquet & Service Details" icon={<Package className="h-5 w-5 text-brand-blue" />}>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment</p>
                                    <p className="text-lg font-bold text-brand-blue">{order.racquet_brand} {order.racquet_model}</p>
                                    <p className="text-sm text-slate-500">Retail Value: ₹{order.racquet_price}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Service Requested</p>
                                    <Badge variant="outline" className="capitalize">{order.service_type}</Badge>
                                    {order.num_cracks && <span className="ml-3 text-sm text-slate-600">{order.num_cracks} Crack(s)</span>}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stringing Specs</p>
                                    <p className="text-sm"><span className="text-slate-500">Type:</span> <span className="font-bold">{order.string_type || 'N/A'}</span></p>
                                    <p className="text-sm"><span className="text-slate-500">Tension:</span> <span className="font-bold">{order.tension_lbs ? `${order.tension_lbs} lbs` : 'N/A'}</span></p>
                                </div>
                                {order.crack_location && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Damage Description</p>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                            &quot;{order.crack_location}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Media Evidence (Removed Photo Upload as per spec, but showing if exists for old orders) */}
                        {order.media_evidence && order.media_evidence.length > 0 && (
                            <div className="mt-8">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Media Evidence</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {order.media_evidence.map((media: any) => (
                                        <div key={media.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={media.file_url} alt="racquet damage" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Section 3: Shipping Log */}
                    <Card title="Logistics Log" icon={<Truck className="h-5 w-5 text-slate-600" />}>
                        <div className="space-y-6">
                            {(order.waybill || order.shiprocket_awb_code) ? (
                                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-full text-brand-blue shadow-sm">
                                            <Truck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-brand-blue uppercase">
                                                {order.waybill ? 'Delhivery Waybill' : 'Shiprocket AWB'}
                                            </p>
                                            <p className="text-lg font-mono font-bold">{order.waybill || order.shiprocket_awb_code}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="bg-white">VIEW FULL TRACKING</Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                    <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
                                    <p className="text-slate-500 font-medium">No shipment booked yet.</p>
                                    <p className="text-xs text-slate-400">Shipment is auto-booked once payment is confirmed.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Actions & Summary */}
                <div className="space-y-8">
                    {/* Order Status Updater Component (Client Side) */}
                    <OrderStatusUpdater order={order} />

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-600" /> Payment Summary
                        </h3>
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Logistics Deposit</span>
                                <span className="font-medium text-slate-700">₹{order.logistics_deposit || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Final Repair Quote</span>
                                <span className="font-bold text-brand-blue">₹{order.final_quote || 'PENDING'}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="font-bold">Total Paid</span>
                                <span className="text-xl font-black text-green-600">₹{order.payment_status === 'paid' ? (order.final_quote || order.logistics_deposit || 0) : 0}</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${order.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {order.payment_status === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                            <div>
                                <p className="text-sm font-bold uppercase tracking-tight">{order.payment_status === 'paid' ? 'Payment Confirmed' : 'Payment Pending'}</p>
                                <p className="text-[10px] opacity-80">{order.payment_id || 'No transaction ID yet'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-8 space-y-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-brand-orange" /> Internal Admin Notes
                        </h3>
                        <textarea
                            className="w-full bg-slate-800 border-none rounded-xl p-4 text-sm text-slate-300 h-32 outline-none focus:ring-1 focus:ring-brand-orange"
                            placeholder="Add private notes only visible to staff..."
                        />
                        <Button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700">SAVE NOTES</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Card({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                <h3 className="font-bold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    )
}

function Users({ className }: { className?: string }) {
    return <Package className={className} /> // reusing icon for now
}
