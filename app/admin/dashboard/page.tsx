'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, RefreshCcw, Truck } from 'lucide-react'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles (full_name, email, phone),
        racquet_specs (brand, model, tension_lbs, knot_type)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch orders')
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, new_status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`)
        fetchOrders()
      } else {
        toast.error(data.error)
      }
    } catch (e) {
      toast.error('Update failed')
    }
  }

  const triggerReturnShipment = async (orderId: string) => {
    toast.info('Creating return shipment via Shiprocket...')
    try {
      const res = await fetch('/api/admin/trigger-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Return shipment created successfully!')
        fetchOrders()
      } else {
        toast.error(data.error || 'Failed to create return shipment')
      }
    } catch (e) {
      toast.error('Failed to trigger return shipment')
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Admin Workshop Dashboard</h1>
        <Button onClick={fetchOrders} variant="outline" size="icon">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repair Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Racquet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.profiles?.full_name}</span>
                      <span className="text-xs text-muted-foreground">{order.profiles?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.racquet_specs?.brand} {order.racquet_specs?.model}
                    <div className="text-xs text-muted-foreground">
                      {order.racquet_specs?.tension_lbs} lbs | {order.racquet_specs?.knot_type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(val) => updateStatus(order.id, val)}
                    >
                      <SelectTrigger className="w-[180px]">
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
                  </TableCell>
                  <TableCell>
                    {order.status === 'In_Workshop' && (
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={() => triggerReturnShipment(order.id)}
                        className="gap-2"
                      >
                        <Truck className="h-4 w-4" /> Ship Back
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
