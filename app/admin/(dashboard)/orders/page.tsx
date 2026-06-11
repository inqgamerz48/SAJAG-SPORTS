"use client";

import { useState, useEffect, useMemo } from "react";
import {
    PackageOpen,
    MapPin,
    Truck,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Mail,
    Phone,
    User,
    Calendar,
    Search,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    Wrench,
    Settings2,
} from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    "Pending": { label: "New Order", color: "bg-gray-100 text-gray-800", icon: PackageOpen },
    "Return_Created": { label: "Return Created", color: "bg-zinc-100 text-zinc-800", icon: PackageOpen },
    "Pickup_Pending": { label: "Pending Pickup", color: "bg-blue-100 text-blue-800", icon: Truck },
    "In_Workshop": { label: "In Workshop", color: "bg-amber-100 text-amber-800", icon: MapPin },
    "Repairing": { label: "Under Repair", color: "bg-amber-200 text-amber-900", icon: AlertCircle },
    "Ready_to_Return": { label: "Ready to Dispatch", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    "Manual_Fulfillment_Required": { label: "Manual Fulfillment Required", color: "bg-red-100 text-red-800", icon: AlertCircle },
    "Shipped": { label: "Shipped", color: "bg-blue-200 text-blue-900", icon: Truck },
    "Completed": { label: "Completed", color: "bg-green-200 text-green-900", icon: CheckCircle2 },
    "Cancelled": { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const ACTIVE_STATUSES = new Set([
    "Pending",
    "Return_Created",
    "Pickup_Pending",
    "In_Workshop",
    "Repairing",
    "Ready_to_Return",
    "Manual_Fulfillment_Required",
    "Shipped",
]);

type Filter = "all" | "active" | "completed";

export default function OrdersFeedPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingData, setTrackingData] = useState<Record<string, any>>({});
    const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
    const [retryLoading, setRetryLoading] = useState<Record<string, boolean>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState<Filter>("active");
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchOrders(page);
    }, [page]);

    const fetchOrders = async (currentPage: number = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders?page=${currentPage}&limit=20`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setOrders(data.orders || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.total || 0);
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
            const res = await fetch("/api/admin/shiprocket-track", {
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

    const retryReversePickup = async (orderId: string) => {
        setRetryLoading(prev => ({ ...prev, [orderId]: true }));
        try {
            const res = await fetch("/api/admin/retry-reverse-pickup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to retry Shiprocket pickup");
            }
            toast.success(data.message || "Reverse pickup retry succeeded");
            fetchOrders();
        } catch (err: any) {
            toast.error(err?.message || "Reverse pickup retry failed");
        } finally {
            setRetryLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const formatDate = (value?: string | Date | null) => {
        if (!value) return "—";
        try {
            const d = new Date(value);
            return d.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "—";
        }
    };

    const customerOf = (order: any) => {
        return {
            name: order.customer?.fullName || order.customerName || "—",
            email: order.customer?.email || order.customerEmail || "—",
            phone: order.customer?.phone || order.customerPhone || "—",
        };
    };

    const fullAddress = (order: any) => {
        const parts = [order.addressLine1, order.city, order.state, order.pincode].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "—";
    };

    const filteredOrders = useMemo(() => {
        const term = search.trim().toLowerCase();
        return orders.filter((order) => {
            if (filter === "active" && !ACTIVE_STATUSES.has(order.status)) return false;
            if (filter === "completed" && !["Completed", "Cancelled"].includes(order.status)) return false;
            if (!term) return true;

            const c = customerOf(order);
            const haystack = [
                order.id,
                c.name,
                c.email,
                c.phone,
                order.serviceType,
                order.pincode,
                order.city,
                order.razorpayPaymentId,
                ...((order.orderItems as any[] | undefined)?.flatMap((item) => [
                    item.racquetBrand,
                    item.racquetModel,
                    item.stringName,
                    item.comments,
                ]) || []),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [orders, filter, search]);

    const toggleExpand = (id: string) =>
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b">
                <h1 className="text-2xl font-bold text-gray-900">Order Tracking Feed</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Full customer choice, photos, and notes for every order — past and present.
                </p>
            </div>

            {/* Toolbar: filter + search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border bg-white p-1 self-start">
                    {(["active", "all", "completed"] as Filter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                filter === f
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            {f === "active"
                                ? "Active"
                                : f === "completed"
                                ? "Completed / Cancelled"
                                : "All Orders"}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, racquet, string..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
            </div>

            <div className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredOrders.length}</span> on this page (Total orders: {totalItems})
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading order feed...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
                        No orders match the current filter.
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const statusConfig = statusMap[order.status] || statusMap["Pending"];
                        const StatusIcon = statusConfig.icon;
                        const customer = customerOf(order);
                        const isOpen = expanded[order.id] ?? true;

                        const reverseShipment = order.shipments?.find(
                            (s: any) => s.provider === "shiprocket" && s.isReverse
                        );
                        const hasValidReverseShipment = Boolean(
                            reverseShipment?.awbCode || reverseShipment?.shiprocketOrderId
                        );
                        const awbCode = reverseShipment?.awbCode || null;
                        const canRetryReversePickup = true;

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* HEADER */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 border-b bg-gray-50/60">
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => toggleExpand(order.id)}
                                            className="mt-1 text-gray-400 hover:text-gray-700 transition-colors"
                                            aria-label="Toggle details"
                                        >
                                            {isOpen ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div>
                                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                                <h2 className="text-lg font-bold text-gray-900">
                                                    Order #{order.id.split("-")[0]}
                                                </h2>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                                                >
                                                    <StatusIcon className="w-3.5 h-3.5 mr-1" />
                                                    {statusConfig.label}
                                                </span>
                                                {order.serviceType && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 capitalize">
                                                        {order.serviceType === "repair" ? (
                                                            <Wrench className="w-3 h-3 mr-1" />
                                                        ) : (
                                                            <Settings2 className="w-3 h-3 mr-1" />
                                                        )}
                                                        {order.serviceType}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Placed {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Payment</p>
                                        <p className="font-semibold text-gray-900 capitalize text-sm">
                                            {order.paymentStatus?.replace(/_/g, " ") || "—"}
                                            {order.finalQuote
                                                ? ` • ₹${Number(order.finalQuote).toLocaleString()}`
                                                : order.logisticsDeposit
                                                ? ` • ₹${Number(order.logisticsDeposit).toLocaleString()}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="p-5 space-y-5">
                                        {/* CUSTOMER + ADDRESS */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-lg border bg-white p-4">
                                                <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
                                                    Customer
                                                </p>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-800">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium">{customer.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        {customer.email !== "—" ? (
                                                            <a
                                                                href={`mailto:${customer.email}`}
                                                                className="hover:underline"
                                                            >
                                                                {customer.email}
                                                            </a>
                                                        ) : (
                                                            <span>—</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {customer.phone !== "—" ? (
                                                            <a
                                                                href={`tel:${customer.phone}`}
                                                                className="hover:underline"
                                                            >
                                                                {customer.phone}
                                                            </a>
                                                        ) : (
                                                            <span>—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border bg-white p-4">
                                                <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
                                                    Pickup / Delivery Address
                                                </p>
                                                <p className="text-sm text-gray-800 leading-relaxed flex gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                    <span>{fullAddress(order)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* ORDER ITEMS */}
                                        <div>
                                            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">
                                                Order Items ({order.orderItems?.length || 0})
                                            </p>
                                            <div className="space-y-3">
                                                {(order.orderItems as any[] | undefined)?.map((item: any, idx: number) => {
                                                    const isService = Boolean(item.serviceType);
                                                    const racquetLabel = [item.racquetBrand, item.racquetModel]
                                                        .filter(Boolean)
                                                        .join(" ");
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="rounded-lg border bg-gray-50/50 p-4"
                                                        >
                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                {/* Image preview */}
                                                                <div className="shrink-0">
                                                                    {item.repairImageUrl ? (
                                                                        <a
                                                                            href={item.repairImageUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block group"
                                                                            title="Open full image"
                                                                        >
                                                                            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-md overflow-hidden border bg-gray-200 group-hover:ring-2 group-hover:ring-amber-500 transition">
                                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                <img
                                                                                    src={item.repairImageUrl}
                                                                                    alt="Customer uploaded photo"
                                                                                    className="h-full w-full object-cover"
                                                                                />
                                                                            </div>
                                                                            <span className="block text-[11px] text-center mt-1 text-amber-700 font-medium underline">
                                                                                View full
                                                                            </span>
                                                                        </a>
                                                                    ) : (
                                                                        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-md border border-dashed bg-white flex flex-col items-center justify-center text-gray-400 text-[11px] text-center px-2">
                                                                            <ImageIcon className="w-6 h-6 mb-1" />
                                                                            —
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Item details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start gap-3 flex-wrap">
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900">
                                                                                {item.quantity}× {item.serviceType || "—"}
                                                                            </p>
                                                                        </div>
                                                                        <p className="text-sm font-semibold text-gray-700 shrink-0">
                                                                            {item.priceAtPurchase != null ? `₹${Number(item.priceAtPurchase).toLocaleString()}` : "—"}
                                                                        </p>
                                                                    </div>

                                                                    {/* Service spec grid */}
                                                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                                                        <SpecField
                                                                            label="Brand"
                                                                            value={item.racquetBrand}
                                                                        />
                                                                        <SpecField
                                                                            label="Model"
                                                                            value={item.racquetModel}
                                                                        />
                                                                        <SpecField
                                                                            label="String"
                                                                            value={item.stringName}
                                                                            highlight
                                                                        />
                                                                        <SpecField
                                                                            label="Tension"
                                                                            value={
                                                                                item.tensionLbs
                                                                                    ? `${item.tensionLbs} lbs`
                                                                                    : null
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <div className="mt-3 text-xs text-gray-700">
                                                                        <span className="font-semibold uppercase tracking-wide text-gray-500">Comments: </span>
                                                                        <span className="font-medium text-gray-900">{item.comments || "—"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {(!order.orderItems || order.orderItems.length === 0) && (
                                                    <div className="rounded-lg border bg-gray-50/50 p-4 text-sm text-gray-500">
                                                        No items recorded for this order.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Update Status
                                                </label>
                                                <select
                                                    className="w-full text-sm border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 px-3 py-2 border"
                                                    value={order.status}
                                                    onChange={(e) =>
                                                        updateOrderStatus(order.id, e.target.value)
                                                    }
                                                >
                                                    {Object.keys(statusMap).map((s) => (
                                                        <option key={s} value={s}>
                                                            {statusMap[s].label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {canRetryReversePickup && (
                                                <div className="md:col-span-1 border rounded-lg p-3 bg-amber-50/60">
                                                    <p className="text-xs text-amber-800 mb-2">
                                                        Shiprocket pickup not created for this paid order.
                                                    </p>
                                                    <button
                                                        onClick={() => retryReversePickup(order.id)}
                                                        disabled={retryLoading[order.id]}
                                                        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        {retryLoading[order.id]
                                                            ? "Retrying..."
                                                            : "Retry Shiprocket Pickup"}
                                                    </button>
                                                </div>
                                            )}

                                            {awbCode && (
                                                <div className="md:col-span-1 border rounded-lg p-3 bg-blue-50/50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            AWB: {awbCode}
                                                        </span>
                                                        <button
                                                            onClick={() => trackShipment(order.id, awbCode)}
                                                            disabled={trackingLoading[order.id]}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            {trackingLoading[order.id]
                                                                ? "Loading..."
                                                                : "Track Live"}
                                                        </button>
                                                    </div>
                                                    {trackingData[order.id] && (
                                                        <div className="text-xs text-gray-600 mt-2">
                                                            Status:{" "}
                                                            <span className="font-medium text-blue-700">
                                                                {trackingData[order.id]?.status || "Not Found"}
                                                            </span>
                                                            {trackingData[order.id]?.current_location && (
                                                                <div className="mt-1">
                                                                    Location:{" "}
                                                                    {trackingData[order.id].current_location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

function SpecField({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value?: string | number | null;
    highlight?: boolean;
}) {
    const display = value === undefined || value === null || value === "" ? "—" : value;
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p
                className={`font-medium ${
                    highlight && display !== "—"
                        ? "text-amber-700"
                        : display === "—"
                        ? "text-gray-400"
                        : "text-gray-900"
                }`}
            >
                {display}
            </p>
        </div>
    );
}
