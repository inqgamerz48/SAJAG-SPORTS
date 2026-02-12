import Link from 'next/link'
import {
    BarChart3,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Package,
    Settings,
    Truck,
    Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b">
                    <Link href="/admin" className="flex items-center gap-2 font-bold text-brand-blue text-xl">
                        <Package className="h-6 w-6 text-brand-orange" />
                        <span>SAJAG ADMIN</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/orders"
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium bg-slate-100 text-brand-blue"
                    >
                        <Package className="h-5 w-5" />
                        Orders
                    </Link>
                    <Link
                        href="/admin/customers"
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium"
                    >
                        <Users className="h-5 w-5" />
                        Customers
                    </Link>
                    <Link
                        href="/admin/analytics"
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium"
                    >
                        <BarChart3 className="h-5 w-5" />
                        Analytics
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-brand-blue rounded-lg transition-colors font-medium"
                    >
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="h-5 w-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {/* Top Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>Admin</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-slate-900 font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-sm">
                            SV
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
