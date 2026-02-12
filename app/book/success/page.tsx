'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string | null>(searchParams.get('order_id'))

  useEffect(() => {
    if (!orderId && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('orderData')
        if (stored) {
          const data = JSON.parse(stored)
          if (data.order_id) setOrderId(data.order_id)
        }
      } catch (_) {}
    }
  }, [orderId])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border-2 border-brand-orange/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-orange">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Payment Successful</CardTitle>
          <CardDescription>Your order is confirmed and we&apos;ll process it shortly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Order ID (save for reference)</p>
              <p className="font-mono text-sm font-medium">{orderId}</p>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              For repair: pickup will be scheduled as per your address. You&apos;ll receive updates via WhatsApp/email.
            </p>
            <p className="text-muted-foreground">
              For stringing: we&apos;ll reach out for same-day pickup in Pune.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="brand" className="flex-1" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/book">Book Another Service</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSuccessContent />
    </Suspense>
  )
}
