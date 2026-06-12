import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        reversePickupBookedAt: null,
        serviceType: { not: null },
        paymentStatus: {
          in: ["fully_paid", "paid_manual_shipping_required", "paid"]
        }
      },
      select: {
        id: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        serviceType: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
