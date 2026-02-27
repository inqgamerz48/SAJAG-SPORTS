import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Fallback check for supabase admin role if needed (though NextAuth protects the route now)
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { order_id, new_status } = await req.json()

        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: new_status })
            .eq('id', order_id)

        if (updateError) throw updateError

        // Trigger Notifications (WhatsApp/Email)
        // This would call lib/notifications.ts

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Update Status Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
