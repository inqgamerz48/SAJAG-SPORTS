'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border-2 border-brand-orange/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-orange">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed</CardTitle>
          <CardDescription>Your service request has been submitted successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono text-sm">{orderId}</p>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              We&apos;ll review your request and get back to you shortly. For repair services, you
              will receive a payment link for the logistics deposit.
            </p>
            <p className="text-muted-foreground">
              You will receive email updates about your order status.
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
