'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RepairForm } from '@/components/repair-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerDashboard() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchMyOrders = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        racquet_specs (brand, model, tension_lbs, knot_type),
        shipments (awb_code, shipment_status, is_reverse)
      `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Failed to fetch your orders')
        } else {
            setOrders(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchMyOrders()
    }, [])

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-brand-blue">My Repairs</h1>
                <p className="text-muted-foreground">Book a new repair or track your active ones.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Booking Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="text-brand-orange" /> Book New Repair
                    </h2>
                    <RepairForm />
                </section>

                {/* Tracking Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="text-brand-blue" /> Active Orders
                    </h2>

                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden border-2 hover:border-brand-blue/30 transition-all">
                                <CardHeader className="bg-slate-50/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {order.racquet_specs?.brand} {order.racquet_specs?.model}
                                            </CardTitle>
                                            <CardDescription>Order ID: {order.id.slice(0, 8)}</CardDescription>
                                        </div>
                                        <Badge variant={
                                            order.status === 'Completed' ? 'default' :
                                                order.status === 'Pickup_Pending' ? 'outline' : 'secondary'
                                        }>
                                            {order.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span>Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {order.shipments?.[0]?.awb_code && (
                                            <div className="flex items-center gap-2 text-brand-blue font-medium">
                                                <Truck className="h-4 w-4" />
                                                <span>AWB: {order.shipments[0].awb_code}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {orders.length === 0 && !loading && (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed">
                                <p className="text-muted-foreground">No active orders found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
