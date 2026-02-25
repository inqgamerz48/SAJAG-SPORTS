"use client";

import { useState, useEffect } from "react";
import { PackageOpen, MapPin, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    "Pending": { label: "New Order", color: "bg-gray-100 text-gray-800", icon: PackageOpen },
    "Pickup_Pending": { label: "Pending Pickup", color: "bg-blue-100 text-blue-800", icon: Truck },
    "In_Workshop": { label: "In Workshop", color: "bg-amber-100 text-amber-800", icon: MapPin },
    "Repairing": { label: "Under Repair", color: "bg-amber-200 text-amber-900", icon: AlertCircle },
    "Ready_to_Return": { label: "Ready to Dispatch", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    "Shipped": { label: "Shipped", color: "bg-blue-200 text-blue-900", icon: Truck },
    "Completed": { label: "Completed", color: "bg-green-200 text-green-900", icon: CheckCircle2 },
    "Cancelled": { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

export default function OrdersFeedPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingData, setTrackingData] = useState<Record<string, any>>({});
    const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/orders");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            toast.error("Could not load orders");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            toast.success("Order status updated");
            fetchOrders();
        } catch (err) {
            toast.error("Could not update order status");
        }
    };

    const trackShipment = async (orderId: string, awbCode: string) => {
        setTrackingLoading(prev => ({ ...prev, [orderId]: true }));
        try {
            const res = await fetch("/api/admin/delhivery-track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbCode }),
            });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setTrackingData(prev => ({ ...prev, [orderId]: data }));
        } catch (err) {
            toast.error("Failed to fetch tracking data");
        } finally {
            setTrackingLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b">
                <h1 className="text-2xl font-bold text-gray-900">Order Tracking Feed</h1>
                <p className="text-gray-500 text-sm mt-1">Manage physical products and service limits</p>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading order feed...</div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border text-center text-gray-500">No orders found.</div>
                ) : (
                    orders.map((order) => {
                        const statusConfig = statusMap[order.status] || statusMap["Pending"];
                        const StatusIcon = statusConfig.icon;

                        // Extract AWB Code (looking at shipments)
                        const awbCode = order.shipments && order.shipments.length > 0 ? order.shipments[0].awbCode : null;

                        return (
                            <div key={order.id} className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h2 className="text-lg font-bold text-gray-900">Order #{order.id.split('-')[0]}</h2>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5 mr-1" />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Customer: <span className="font-medium text-gray-900">{order.customer?.fullName || 'Guest'}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Payment: <span className="font-medium capitalize">{order.paymentStatus}</span>
                                            {order.finalQuote && ` • ₹${order.finalQuote}`}
                                        </p>

                                        <div className="mt-4 bg-gray-50 p-3 rounded-lg border text-sm">
                                            <p className="font-semibold text-gray-700 mb-2">Order Items:</p>
                                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                                {order.orderItems?.map((item: any) => (
                                                    <li key={item.id}>
                                                        {item.quantity}x {item.serviceType
                                                            ? `${item.serviceType} (${item.racquetBrand || ''} ${item.racquetModel || ''})`
                                                            : `Product ID: ${item.productId}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end space-y-4">
                                        <div className="w-full max-w-xs">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Update Status</label>
                                            <select
                                                className="w-full text-sm border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 px-3 py-2 border"
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            >
                                                {Object.keys(statusMap).map(s => (
                                                    <option key={s} value={s}>{statusMap[s].label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {awbCode && (
                                            <div className="w-full max-w-xs border rounded-lg p-3 bg-blue-50/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-semibold text-gray-700">AWB: {awbCode}</span>
                                                    <button
                                                        onClick={() => trackShipment(order.id, awbCode)}
                                                        disabled={trackingLoading[order.id]}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        {trackingLoading[order.id] ? "Loading..." : "Track Live"}
                                                    </button>
                                                </div>
                                                {trackingData[order.id] && (
                                                    <div className="text-xs text-gray-600 mt-2">
                                                        Status: <span className="font-medium text-blue-700">
                                                            {trackingData[order.id]?.status || 'Not Found'}
                                                        </span>
                                                        {trackingData[order.id]?.current_location && (
                                                            <div className="mt-1">
                                                                Location: {trackingData[order.id].current_location}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
