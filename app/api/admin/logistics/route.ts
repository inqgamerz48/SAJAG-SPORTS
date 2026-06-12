import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            customerName: true,
            status: true,
          }
        }
      }
    });

    const totalShipments = shipments.length;
    const fallbackCount = shipments.filter(s => s.awbCode && s.isFallback).length;
    const smartMatched = shipments.filter(s => s.awbCode && !s.isFallback).length;
    
    // Match rate calculation is based on resolved Shipments (having AWB code)
    const activeShipmentsCount = shipments.filter(s => s.awbCode).length;
    const smartRate = activeShipmentsCount > 0 ? (smartMatched / activeShipmentsCount) * 100 : 0;
    const fallbackRate = activeShipmentsCount > 0 ? (fallbackCount / activeShipmentsCount) * 100 : 0;

    const rates = shipments.map(s => Number(s.courierRate || 0)).filter(r => r > 0);
    const averageRate = rates.length > 0 ? rates.reduce((sum, r) => sum + r, 0) / rates.length : 0;

    return NextResponse.json({
      shipments,
      stats: {
        totalShipments,
        smartMatched,
        fallbackCount,
        smartRate: Math.round(smartRate),
        fallbackRate: Math.round(fallbackRate),
        averageRate: Math.round(averageRate),
      }
    });
  } catch (error) {
    console.error("Error in logistics API:", error);
    return NextResponse.json({ 
      error: "Failed to fetch logistics data", 
      reason: "An unexpected database error occurred while calculating logistics metrics." 
    }, { status: 500 });
  }
}
