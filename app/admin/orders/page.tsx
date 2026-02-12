import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    ChevronRight,
    ArrowUpDown,
    Package,
    CheckCircle2,
    BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrdersPage() {
    const supabase = await createClient()

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

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

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700'
            case 'pending': return 'bg-red-100 text-red-700'
            case 'refunded': return 'bg-slate-100 text-slate-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Orders</h1>
                    <p className="text-slate-500">Manage and track all racquet repair and stringing orders.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button className="bg-brand-blue gap-2">
                        NEW ORDER
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-4 border-none shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Package className="h-5 w-5" /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                        <p className="text-xl font-bold">{orders?.length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 border-none shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><ArrowUpDown className="h-5 w-5" /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Analyzing</p>
                        <p className="text-xl font-bold">{orders?.filter(o => o.status === 'analyzing').length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 border-none shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Activity className="h-5 w-5" /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">In Repair</p>
                        <p className="text-xl font-bold">{orders?.filter(o => o.status === 'in_repair').length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 border-none shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Delivered</p>
                        <p className="text-xl font-bold">{orders?.filter(o => o.status === 'delivered').length || 0}</p>
                    </div>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Name or Pincode..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[100px]">Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders?.map((order) => (
                            <TableRow key={order.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-mono text-xs text-slate-500">
                                    {order.id.slice(0, 8)}...
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{order.customer_name}</span>
                                        <span className="text-xs text-slate-500">{order.customer_phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium capitalize">{order.service_type}</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-tight">{order.racquet_brand} {order.racquet_model}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`font-medium border-none shadow-none text-[10px] uppercase px-2 ${getStatusColor(order.status)}`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`font-medium border-none shadow-none text-[10px] uppercase px-2 ${getPaymentStatusColor(order.payment_status)}`}>
                                        {order.payment_status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-slate-700">
                                    ₹{order.logistics_deposit || order.final_quote || 0}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="sm" className="hover:text-brand-blue hover:bg-blue-50">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Eye className="h-4 w-4 mr-2" /> Details
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!orders || orders.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
            {children}
        </div>
    )
}

function Activity({ className }: { className?: string }) {
    return <BarChart3 className={className} />
}
