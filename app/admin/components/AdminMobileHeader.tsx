"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, LogOut, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/admin/inventory", icon: Package },
];

export default function AdminMobileHeader() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-white h-16 px-4 border-b fixed top-0 w-full z-50">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Sajag Admin
                </span>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)}>
                    <div
                        className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col mt-16"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors ${isActive
                                                ? "bg-amber-50 text-amber-600"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                    >
                                        <Icon className={`mr-4 h-6 w-6 ${isActive ? "text-amber-500" : "text-gray-400"}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t">
                            <button
                                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                                className="flex w-full items-center px-4 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="mr-4 h-6 w-6 text-red-500" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
