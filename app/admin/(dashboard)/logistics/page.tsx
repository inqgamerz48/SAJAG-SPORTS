"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Loader2,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

interface Shipment {
  id: string;
  orderId: string;
  awbCode: string | null;
  shiprocketOrderId: string | null;
  shipmentStatus: string | null;
  isReverse: boolean;
  courierName: string | null;
  courierRate: string | number | null;
  courierRating: string | number | null;
  isFallback: boolean;
  createdAt: string;
  order?: {
    customerName: string | null;
    status: string | null;
  };
}

interface Stats {
  totalShipments: number;
  smartMatched: number;
  fallbackCount: number;
  smartRate: number;
  fallbackRate: number;
  averageRate: number;
}

export default function LogisticsMonitoringPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "smart" | "fallback">("all");

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logistics");
      if (!res.ok) throw new Error("Failed to fetch logistics data");
      const data = await res.json();
      setShipments(data.shipments || []);
      setStats(data.stats || null);
    } catch (err) {
      toast.error("Could not load logistics monitoring data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "—";
    try {
      const d = new Date(value);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const filteredShipments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return shipments.filter((s) => {
      // Filter Type
      if (filterType === "smart" && (s.isFallback || !s.awbCode)) return false;
      if (filterType === "fallback" && (!s.isFallback || !s.awbCode)) return false;

      // Search term
      if (!term) return true;
      const haystack = [
        s.orderId,
        s.awbCode,
        s.courierName,
        s.shipmentStatus,
        s.order?.customerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [shipments, filterType, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-7 h-7 text-amber-500" />
          Smart Logistics Monitoring
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Track smart courier matching performance, fallback rates, and real-time shipping costs.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Loading logistics dashboard...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Shipments */}
              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Shipments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalShipments}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                  <Truck className="w-6 h-6" />
                </div>
              </div>

              {/* Smart Match Success Rate */}
              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Smart Match Success</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.smartRate}%</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <Percent className="w-6 h-6" />
                </div>
              </div>

              {/* Fallback Rate */}
              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Auto-assign Fallback</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.fallbackRate}%</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              {/* Average Courier Cost */}
              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Shipping Cost</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.averageRate}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* Filtering Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border bg-white p-1 self-start">
              {(["all", "smart", "fallback"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 text-sm rounded-md transition-colors capitalize ${
                    filterType === type
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {type === "all"
                    ? "All Shipments"
                    : type === "smart"
                    ? "Smart Match Success"
                    : "Auto-assigned Fallback"}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID, AWB, Courier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Shipments Log Table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-500 font-medium text-xs uppercase tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Direction</th>
                    <th className="p-4">AWB Code</th>
                    <th className="p-4">Courier Name</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Rate Charged</th>
                    <th className="p-4">Allocation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No shipments found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-gray-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(s.createdAt)}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-gray-900 whitespace-nowrap">
                          #{s.orderId.split("-")[0]}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {s.isReverse ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                              Reverse Pickup
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              Forward Return
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-gray-600 whitespace-nowrap">
                          {s.awbCode || <span className="text-gray-400 italic">Pending</span>}
                        </td>
                        <td className="p-4 text-gray-800 whitespace-nowrap font-medium">
                          {s.courierName || <span className="text-gray-400 font-normal">—</span>}
                        </td>
                        <td className="p-4 text-gray-700 whitespace-nowrap font-semibold">
                          {s.courierRating != null ? `⭐ ${Number(s.courierRating).toFixed(1)}` : "—"}
                        </td>
                        <td className="p-4 text-gray-900 whitespace-nowrap font-semibold">
                          {s.courierRate != null ? `₹${Number(s.courierRate).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {!s.awbCode ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No AWB Created
                            </span>
                          ) : s.isFallback ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Auto-assigned Fallback
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Smart Selected Cheapest
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
