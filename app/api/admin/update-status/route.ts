import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
        }

        const { order_id, new_status } = await req.json()

        if (!order_id || !new_status) {
            return NextResponse.json({ success: false, error: 'order_id and new_status are required' }, { status: 400 })
        }

        await prisma.order.update({
            where: { id: order_id },
            data: { status: new_status },
        })

        // Trigger Notifications (WhatsApp/Email)
        // This would call lib/notifications.ts

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Update Status Error:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to update order status', 
            reason: 'An unexpected database error occurred while updating the order status.' 
        }, { status: 500 })
    }
}

