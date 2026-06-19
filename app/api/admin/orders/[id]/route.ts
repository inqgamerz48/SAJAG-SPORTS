import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmailNotification, sendSMSNotification, templates } from "@/lib/notifications";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();

        const validStatuses = [
            "Pending", "Return_Created", "Pickup_Pending", "Manual_Fulfillment_Required", "In_Workshop",
            "Repairing", "Ready_to_Return", "Shipped", "Completed", "Cancelled"
        ];

        if (data.status && !validStatuses.includes(data.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { id } = await params;
        const existingOrder = await prisma.order.findUnique({
            where: { id }
        });

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

        if (data.status === 'Completed' && existingOrder?.status !== 'Completed') {
            const customerName = updatedOrder.customerName || updatedOrder.customer?.fullName || 'Customer';
            const customerEmail = updatedOrder.customerEmail || updatedOrder.customer?.email;
            const customerPhone = updatedOrder.customerPhone || updatedOrder.customer?.phone;
            const completeTemplate = templates.orderCompleted(updatedOrder.id, customerName);

            if (customerEmail) {
                sendEmailNotification({
                    to: customerEmail,
                    subject: completeTemplate.subject,
                    text: completeTemplate.text
                }).catch(err => console.error('Failed to send orderCompleted email', err));
            }
            if (customerPhone) {
                sendSMSNotification(customerPhone, completeTemplate.sms).catch(err => console.error('Failed to send orderCompleted SMS', err));
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ 
            error: "Failed to update order", 
            reason: "An unexpected database error occurred while updating the order status." 
        }, { status: 500 });
    }
}
