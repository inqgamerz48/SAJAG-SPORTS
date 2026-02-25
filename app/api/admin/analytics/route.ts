import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Total Revenue (sum of all completed/shipped finalQuote)
        const revenueResult = await prisma.order.aggregate({
            _sum: { finalQuote: true },
            where: {
                status: { in: ["Completed", "Shipped"] }
            }
        });
        const totalRevenue = Number(revenueResult._sum.finalQuote || 0);

        // 2. Average Order Value
        const countResult = await prisma.order.count({
            where: {
                status: { in: ["Completed", "Shipped"] }
            }
        });
        const averageOrderValue = countResult > 0 ? (totalRevenue / countResult).toFixed(2) : 0;

        // 3. Best Selling Items (OrderItems frequency)
        const orderItems = await prisma.orderItem.findMany();
        const itemCounts: Record<string, { name: string, count: number, revenue: number }> = {};

        orderItems.forEach((item: any) => {
            const key = item.productId || item.serviceType || "Unknown";
            const name = item.productId
                ? `Product ID: ${item.productId}`
                : `${item.serviceType} (${item.racquetBrand || 'Any'} ${item.racquetModel || 'Model'})`;

            if (!itemCounts[key]) {
                itemCounts[key] = { name, count: 0, revenue: 0 };
            }
            itemCounts[key].count += item.quantity;
            itemCounts[key].revenue += Number(item.priceAtPurchase) * item.quantity;
        });

        const bestSelling = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 4. Status Breakdown
        const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            _count: true
        });

        return NextResponse.json({
            totalRevenue,
            averageOrderValue,
            bestSelling,
            statusCounts: statusCounts.map((s: any) => ({
                status: s.status,
                count: s._count
            })),
            totalOrders: await prisma.order.count()
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
