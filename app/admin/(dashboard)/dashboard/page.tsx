"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ShoppingBag, Activity } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      const analyticsInfo = await res.json();
      setData(analyticsInfo);
    } catch (err) {
      toast.error("Could not load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading Dashboard Metrics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your store's performance</p>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <h3 className="font-semibold text-sm text-gray-500">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{data.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <h3 className="font-semibold text-sm text-gray-500">Average Order Value</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{Number(data.averageOrderValue).toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg"><ShoppingBag className="w-5 h-5 text-amber-600" /></div>
            <h3 className="font-semibold text-sm text-gray-500">Total Orders</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg"><Activity className="w-5 h-5 text-purple-600" /></div>
            <h3 className="font-semibold text-sm text-gray-500">Active Services</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.statusCounts?.find((s: any) => s.status === 'In_Workshop' || s.status === 'Repairing')?._count || 0}
          </p>
        </div>
      </div>

      {/* Advanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Best Selling Items */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Best Selling Products & Services</h2>
          {data.bestSelling?.length > 0 ? (
            <div className="space-y-4">
              {data.bestSelling.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mr-3">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.count} Sales</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ₹{item.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-6">No sales data recorded yet.</div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status Breakdown</h2>
          <div className="space-y-4">
            {data.statusCounts?.map((statusObj: any, idx: number) => {
              // Calculate percentage width roughly
              const percentage = Math.max(1, (statusObj.count / data.totalOrders) * 100);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{statusObj.status.replace("_", " ")}</span>
                    <span className="text-gray-500 font-semibold">{statusObj.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {!data.statusCounts?.length && (
              <div className="text-sm text-gray-500 text-center py-6">No orders recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
