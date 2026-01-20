'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  approveOrderForPickup,
  updateOrderStatus,
  updateFinalQuote,
  rejectAndRefundOrder,
} from '@/app/actions/orders'
import { generateShippingLabel } from '@/lib/shiprocket'
import { Package, CheckCircle2, XCircle, AlertCircle, Truck, Wrench, Scissors } from 'lucide-react'
import Image from 'next/image'

interface Order {
  id: string
  service_type: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  racquet_brand: string
  racquet_model: string
  final_quote: number | null
  logistics_deposit: number | null
  shiprocket_awb_code: string | null
  created_at: string
}

interface MediaEvidence {
  id: string
  media_type: string
  file_url: string
}

const statusColumns = [
  { id: 'analyzing', label: 'Incoming', icon: Package },
  { id: 'approved_for_pickup', label: 'Inspection', icon: AlertCircle },
  { id: 'in_surgery', label: 'In Repair', icon: Wrench },
  { id: 'ready_for_stringing', label: 'Ready for Stringing', icon: Scissors },
  { id: 'completed', label: 'Dispatched', icon: CheckCircle2 },
]

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderMedia, setOrderMedia] = useState<MediaEvidence[]>([])
  const [finalQuote, setFinalQuote] = useState('')
  const [loading, setLoading] = useState(false)
  const [stringInventory, setStringInventory] = useState<Array<{ string_type: string; remaining_meters: number }>>([])

  useEffect(() => {
    fetchOrders()
    fetchStringInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchOrders() {
    try {
      const supabaseClient = createClient()
      const { data } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  async function fetchStringInventory() {
    try {
      const supabaseClient = createClient()
      const { data } = await supabaseClient.from('string_inventory').select('string_type, remaining_meters')
      if (data) {
        setStringInventory(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  async function handleOrderClick(order: Order) {
    setSelectedOrder(order)
    try {
      const supabaseClient = createClient()
      const { data } = await supabaseClient
        .from('media_evidence')
        .select('*')
        .eq('order_id', order.id)
      if (data) {
        setOrderMedia(data)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    }
  }

  async function handleApprovePickup() {
    if (!selectedOrder) return
    setLoading(true)
    const result = await approveOrderForPickup(selectedOrder.id)
    if (result.success) {
      await fetchOrders()
      setSelectedOrder(null)
    }
    setLoading(false)
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!selectedOrder) return
    setLoading(true)
    await updateOrderStatus(selectedOrder.id, newStatus)
    await fetchOrders()
    setSelectedOrder(null)
    setLoading(false)
  }

  async function handleUpdateQuote() {
    if (!selectedOrder || !finalQuote) return
    setLoading(true)
    await updateFinalQuote(selectedOrder.id, parseFloat(finalQuote))
    await fetchOrders()
    setSelectedOrder(null)
    setFinalQuote('')
    setLoading(false)
  }

  async function handleReject() {
    if (!selectedOrder) return
    if (confirm('Are you sure you want to reject this order and issue a refund?')) {
      setLoading(true)
      await rejectAndRefundOrder(selectedOrder.id)
      await fetchOrders()
      setSelectedOrder(null)
      setLoading(false)
    }
  }

  async function handleGenerateLabel() {
    if (!selectedOrder?.shiprocket_awb_code) return
    setLoading(true)
    const label = await generateShippingLabel(selectedOrder.shiprocket_awb_code)
    if (label) {
      window.open(label.label_url, '_blank')
    }
    setLoading(false)
  }

  const ordersByStatus = statusColumns.reduce((acc, col) => {
    acc[col.id] = orders.filter((o) => o.status === col.id)
    return acc
  }, {} as Record<string, Order[]>)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold bg-gradient-to-r from-brand-orange via-brand-blue to-brand-red bg-clip-text text-transparent">
            Mission Control
          </h1>
          <p className="text-gray-600">Admin Dashboard - Order Management</p>
        </div>

        {/* String Inventory Alert */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>String Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {stringInventory.map((item) => (
                <div key={item.string_type} className="rounded border p-3">
                  <p className="font-semibold">{item.string_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.remaining_meters.toFixed(0)}m remaining
                  </p>
                  {item.remaining_meters < 50 && (
                    <p className="mt-1 text-xs text-yellow-500">Low stock alert</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="grid gap-4 md:grid-cols-5">
          {statusColumns.map((column) => {
            const Icon = column.icon
            return (
              <Card key={column.id} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4" />
                    {column.label}
                  </CardTitle>
                  <CardDescription>{ordersByStatus[column.id]?.length || 0} orders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ordersByStatus[column.id]?.map((order) => (
                    <Card
                      key={order.id}
                      className="cursor-pointer border p-3 transition-all hover:border-brand-orange hover:shadow-md"
                      onClick={() => handleOrderClick(order)}
                    >
                      <p className="text-xs font-semibold">
                        {order.racquet_brand} {order.racquet_model}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                      <p className="mt-1 text-xs">
                        {order.service_type === 'stringing' ? (
                          <Scissors className="inline h-3 w-3" />
                        ) : (
                          <Wrench className="inline h-3 w-3" />
                        )}{' '}
                        {order.service_type}
                      </p>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Order Detail Dialog */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>Order ID: {selectedOrder.id}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Customer Information</h3>
                  <p className="text-sm">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                </div>

                <div>
                  <h3 className="font-semibold">Racquet</h3>
                  <p className="text-sm">
                    {selectedOrder.racquet_brand} {selectedOrder.racquet_model}
                  </p>
                  <p className="text-sm">Service: {selectedOrder.service_type}</p>
                </div>

                {orderMedia.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Crack Photos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {orderMedia.map((media) => (
                        <div key={media.id} className="relative h-24 w-full rounded border">
                          <Image
                            src={media.file_url}
                            alt={media.media_type}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.shiprocket_awb_code && (
                  <div>
                    <h3 className="font-semibold">Shiprocket AWB</h3>
                    <p className="text-sm">{selectedOrder.shiprocket_awb_code}</p>
                  </div>
                )}

                {selectedOrder.status === 'analyzing' && selectedOrder.service_type === 'repair' && (
                  <div className="space-y-2">
                    <Button
                      variant="brand"
                      onClick={handleApprovePickup}
                      disabled={loading}
                      className="w-full"
                    >
                      Approve & Generate Shiprocket Label
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading} className="w-full">
                      Reject & Refund
                    </Button>
                  </div>
                )}

                {selectedOrder.status === 'approved_for_pickup' && (
                  <div className="space-y-2">
                    {selectedOrder.shiprocket_awb_code && (
                      <Button
                        variant="outline"
                        onClick={handleGenerateLabel}
                        disabled={loading}
                        className="w-full"
                      >
                        Generate Shipping Label
                      </Button>
                    )}
                    <Button
                      variant="brand"
                      onClick={() => handleStatusUpdate('in_surgery')}
                      disabled={loading}
                      className="w-full"
                    >
                      Mark as In Surgery
                    </Button>
                  </div>
                )}

                {selectedOrder.status === 'in_surgery' && (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="finalQuote">Final Quote (₹)</Label>
                      <Input
                        id="finalQuote"
                        type="number"
                        value={finalQuote}
                        onChange={(e) => setFinalQuote(e.target.value)}
                        className="mt-2"
                        placeholder="Enter final quote"
                      />
                    </div>
                    <Button
                      variant="brand"
                      onClick={handleUpdateQuote}
                      disabled={loading || !finalQuote}
                      className="w-full"
                    >
                      Update Quote & Send Payment Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('ready_for_stringing')}
                      disabled={loading}
                      className="w-full"
                    >
                      Ready for Stringing
                    </Button>
                  </div>
                )}

                {selectedOrder.status === 'ready_for_stringing' && (
                  <Button
                    variant="brand"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={loading}
                    className="w-full"
                  >
                    Mark as Completed & Dispatched
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
