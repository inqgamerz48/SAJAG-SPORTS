"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingCart, Package, Settings, LogOut, Truck } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/admin/inventory", icon: Package },
    { name: "Logistics", href: "/admin/logistics", icon: Truck },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r min-h-screen hidden lg:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Sajag Admin
                </span>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? "bg-amber-50 text-amber-600"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                        >
                            <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-amber-500" : "text-gray-400"}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex w-full items-center px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 text-red-500" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
