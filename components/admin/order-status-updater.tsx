'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateOrderStatus, updateFinalQuote } from '@/app/actions/orders'
import { toast } from 'sonner'
import { Loader2, Save, Send } from 'lucide-react'

export default function OrderStatusUpdater({ order }: { order: any }) {
    const [status, setStatus] = useState(order.status)
    const [finalQuote, setFinalQuote] = useState(order.final_quote || '')
    const [loading, setLoading] = useState(false)

    const handleUpdateStatus = async () => {
        setLoading(true)
        try {
            const result = await updateOrderStatus(order.id, status)
            if (result.success) {
                toast.success('Status updated successfully')
            } else {
                toast.error(result.error || 'Failed to update status')
            }
        } catch (error) {
            toast.error('Error updating status')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateQuote = async () => {
        setLoading(true)
        try {
            const result = await updateFinalQuote(order.id, parseFloat(finalQuote))
            if (result.success) {
                toast.success('Final quote updated. Payment link ready.')
                // In a real app, you'd trigger an email/SMS here too
            } else {
                toast.error(result.error || 'Failed to update quote')
            }
        } catch (error) {
            toast.error('Error updating quote')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Manage Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="status">Order Status</Label>
                    <div className="flex gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pickup_Pending">Pickup Pending</SelectItem>
                                <SelectItem value="In_Workshop">In Workshop</SelectItem>
                                <SelectItem value="Repairing">Repairing</SelectItem>
                                <SelectItem value="Ready_to_Return">Ready to Return</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleUpdateStatus} disabled={loading} size="icon" className="bg-brand-blue">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quote">Final Repair Quote (₹)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="quote"
                            type="number"
                            placeholder="0.00"
                            value={finalQuote}
                            onChange={(e) => setFinalQuote(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleUpdateQuote} disabled={loading} size="icon" className="bg-brand-orange border-brand-orange">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-400">Updating the quote generates a payment link for the customer.</p>
                </div>
            </CardContent>
        </Card>
    )
}
