import {
    Activity,
    ArrowUpRight,
    CreditCard,
    Package,
    Truck,
    CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function AdminDashboardPage() {
    const stats = [
        {
            title: "Total Revenue",
            value: "₹45,280",
            change: "+12.5%",
            icon: <CreditCard className="h-4 w-4 text-slate-600" />,
            color: "bg-green-50 text-green-700"
        },
        {
            title: "Total Orders",
            value: "124",
            change: "+8.2%",
            icon: <Package className="h-4 w-4 text-slate-600" />,
            color: "bg-blue-50 text-blue-700"
        },
        {
            title: "Pending Pickups",
            value: "12",
            change: "-2",
            icon: <Truck className="h-4 w-4 text-slate-600" />,
            color: "bg-orange-50 text-orange-700"
        },
        {
            title: "Active Repairs",
            value: "28",
            change: "+5",
            icon: <Activity className="h-4 w-4 text-slate-600" />,
            color: "bg-purple-50 text-purple-700"
        }
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back! Here&apos;s what&apos;s happening with Sajag Sports today.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                            <div className={`p - 2 rounded - lg ${stat.color} `}>{stat.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-slate-400 mt-1">
                                <span className="text-green-500 font-medium inline-flex items-center">
                                    {stat.change} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                                </span> from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* placeholder for chart or activity list */}
                        <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <p className="text-slate-400">Activity Chart Placeholder</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Service Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Repair Service</span>
                                <span className="text-slate-500">65%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-blue w-[65%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Premium Stringing</span>
                                <span className="text-slate-500">25%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-orange w-[25%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Budget Stringing</span>
                                <span className="text-slate-500">10%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 w-[10%]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
