"use client";

import { useState } from "react";
import { PackageOpen, Truck, MapPin, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";

const steps = [
    { id: "Pending", label: "Order Received", icon: PackageOpen },
    { id: "Pickup_Pending", label: "Pickup Arranged", icon: Truck },
    { id: "In_Workshop", label: "In Workshop", icon: MapPin },
    { id: "Repairing", label: "Under Repair", icon: AlertCircle },
    { id: "Ready_to_Return", label: "Ready to Dispatch", icon: CheckCircle2 },
    { id: "Shipped", label: "Shipped", icon: Truck },
    { id: "Completed", label: "Delivered", icon: CheckCircle2 },
];

export default function TrackRepairPage() {
    const [orderId, setOrderId] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId || !phone) return;

        setLoading(true);
        setOrderData(null);
        try {
            const res = await fetch("/api/track-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to find order");

            setOrderData(data.order);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentStepIndex = orderData ? steps.findIndex(s => s.id === orderData.status) : -1;

    return (
        <div className="min-h-screen bg-white">
            {/* Header/Hero */}
            <div className="bg-neutral-50 border-b relative">
                <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center pt-32">
                    <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
                        Track <span className="text-amber-500">Your Repair</span>
                    </h1>
                    <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto">
                        Enter your order ID and the phone number used at checkout to see real-time updates on your racquet service.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative -mt-16">
                <div className="bg-white rounded-2xl shadow-xl border p-6 sm:p-10 mb-8">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="orderId" className="sr-only">Order ID</label>
                            <input
                                id="orderId"
                                type="text"
                                placeholder="Order ID (e.g., 550e8400...)"
                                className="w-full border-neutral-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 py-3 px-4 outline-none border transition"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="phone" className="sr-only">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="Phone Number"
                                className="w-full border-neutral-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 py-3 px-4 outline-none border transition"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-75 transition"
                        >
                            {loading ? "Searching..." : (
                                <>
                                    <Search className="w-5 h-5 mr-2" />
                                    Track
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {orderData && (
                    <div className="bg-white rounded-2xl shadow-xl border p-6 sm:p-10">
                        <div className="mb-8 border-b pb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Order Highlights</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-neutral-500">Service</p>
                                    <p className="font-semibold capitalize text-neutral-900">{orderData.service_type || "Products"}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-500">Customer</p>
                                    <p className="font-semibold text-neutral-900">{orderData.customer_name}</p>
                                </div>
                                {orderData.racquet_brand && (
                                    <div>
                                        <p className="text-neutral-500">Racquet</p>
                                        <p className="font-semibold text-neutral-900">{orderData.racquet_brand} {orderData.racquet_model}</p>
                                    </div>
                                )}
                                {(orderData.waybill || orderData.shiprocket_awb_code) && (
                                    <div>
                                        <p className="text-neutral-500">Tracking AWB</p>
                                        <p className="font-semibold text-amber-600 font-mono">
                                            {orderData.waybill || orderData.shiprocket_awb_code}
                                        </p>
                                        <a
                                            href={orderData.waybill
                                                ? `https://www.shiprocket.com/track/package/${orderData.waybill}`
                                                : `https://shiprocket.co/tracking/${orderData.shiprocket_awb_code}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 block"
                                        >
                                            Track Live &rarr;
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-neutral-200"></div>

                            <div className="space-y-8">
                                {steps.map((step, index) => {
                                    const isCompleted = currentStepIndex >= index;
                                    const isCurrent = currentStepIndex === index;
                                    const Icon = step.icon;

                                    return (
                                        <div key={step.id} className="relative flex items-center group">
                                            <div className={`
                        z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white
                        transition-all duration-300
                        ${isCompleted ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-400'}
                      `}>
                                                <Icon className="w-5 h-5" />
                                            </div>

                                            <div className="ml-4 flex-1">
                                                <h3 className={`text-lg font-semibold ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                                    {step.label}
                                                </h3>
                                                {isCurrent && (
                                                    <p className="text-sm text-neutral-500 mt-1">
                                                        Your order is currently at this stage.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
