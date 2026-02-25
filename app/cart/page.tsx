"use client";

import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function CartPage() {
    const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
    const { user, openAuthModal } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handleCheckout = async () => {
        if (!user) {
            toast.info("Please login to proceed to checkout.");
            openAuthModal();
            return;
        }

        const hasOnlyServices = items.every(item => item.type === 'service')

        if (hasOnlyServices) {
            toast('Need a new grip with that?', {
                description: 'Check out our store for premium grips before checking out.',
                action: {
                    label: 'Go to Store',
                    onClick: () => router.push('/shop')
                },
            });
            // We still let them proceed after the toast, or they can click the toast action
        }

        router.push('/checkout');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-16 lg:pt-24 pb-32">
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
                    Your Cart
                </h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <ul className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <li key={item.id} className="p-4 sm:p-6 flex items-start gap-4">
                                        {/* Placeholder for Product Image or Service Icon */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-200">
                                            {item.type === 'service' ? (
                                                <div className="text-amber-500 font-bold text-xs uppercase text-center px-1">
                                                    Service
                                                </div>
                                            ) : (
                                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                                                    {item.type === 'service' && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {item.racquetBrand} {item.racquetModel} {item.tension ? `• ${item.tension} lbs` : ''}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-amber-600 font-medium mt-1">₹{item.price.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center border border-gray-200 rounded-full bg-white">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-2 text-gray-500 hover:text-gray-900 transition border-r"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-semibold text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-2 text-gray-500 hover:text-gray-900 transition border-l"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Remove Action */}
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition p-2"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <div className="space-y-3 text-sm text-gray-500">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900">₹{getTotalPrice().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping Estimated</span>
                                    <span className="font-medium text-gray-900">Calculated at checkout</span>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>₹{getTotalPrice().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Thumb Zone Checkout Button - Fixed at bottom on Mobile, sticky on desktop */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 lg:py-6 z-50">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-500">Total Price</p>
                            <p className="text-2xl font-bold text-gray-900">₹{getTotalPrice().toLocaleString()}</p>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-75 transition transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isProcessing ? "Processing..." : (
                                <>
                                    Checkout Securely
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
