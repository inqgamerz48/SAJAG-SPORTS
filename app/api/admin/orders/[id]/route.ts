import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();

        const validStatuses = [
            "Pending", "Pickup_Pending", "Manual_Fulfillment_Required", "In_Workshop",
            "Repairing", "Ready_to_Return", "Shipped", "Completed", "Cancelled"
        ];

        if (data.status && !validStatuses.includes(data.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { id } = await params;
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: data.status,
            },
            include: {
                customer: true,
                shipments: true,
            }
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ 
            error: "Failed to update order", 
            reason: "An unexpected database error occurred while updating the order status." 
        }, { status: 500 });
    }
}
