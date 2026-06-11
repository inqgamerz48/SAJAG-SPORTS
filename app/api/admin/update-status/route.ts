import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from 'zod'

const updateStatusSchema = z.object({
  order_id: z.string().uuid('Invalid order ID format'),
  new_status: z.string().min(1, 'new_status is required'),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = updateStatusSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
        }
        const { order_id, new_status } = parsed.data

        await prisma.order.update({
            where: { id: order_id },
            data: { status: new_status as any },
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

