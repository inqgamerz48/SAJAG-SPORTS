'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Package, CreditCard } from 'lucide-react'

interface PaymentData {
  serviceType: 'repair' | 'stringing'
  name: string
  address: string
  racquetName?: string
  stringName?: string
  tension?: number
  photoCount?: number
}

// These will be configurable later
const PRICING = {
  shipping: 199, // Shipping charges for repair
  stringing: 300, // Base stringing charge
  repair: 500, // Base repair charge
  sameDayDelivery: 0, // Same day delivery is free for Pune
}

export default function PaymentPage() {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get form data from sessionStorage
    const repairData = sessionStorage.getItem('repairFormData')
    const stringingData = sessionStorage.getItem('stringingFormData')

    if (repairData) {
      setPaymentData(JSON.parse(repairData))
      sessionStorage.removeItem('repairFormData')
    } else if (stringingData) {
      setPaymentData(JSON.parse(stringingData))
      sessionStorage.removeItem('stringingFormData')
    } else {
      // No data found, redirect back
      router.push('/book')
    }
  }, [router])

  const calculateTotal = () => {
    if (!paymentData) return 0

    if (paymentData.serviceType === 'repair') {
      return PRICING.shipping + PRICING.repair
    } else {
      // Stringing - same day delivery, no shipping
      return PRICING.stringing + PRICING.sameDayDelivery
    }
  }

  const handlePayment = async () => {
    if (!paymentData) return
    
    setLoading(true)
    
    // TODO: Integrate with Razorpay payment gateway
    // For now, just simulate payment success
    setTimeout(() => {
      // Store order data
      sessionStorage.setItem('orderData', JSON.stringify({
        ...paymentData,
        total: calculateTotal(),
        paymentStatus: 'pending',
      }))
      
      router.push('/book/success')
    }, 1000)
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment</h1>
          <p className="text-gray-600">Review your order and proceed to payment</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Order Summary */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-2 border-gray-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Type */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {paymentData.serviceType === 'repair' ? 'Racquet Repair Service' : 'Racquet Stringing Service'}
                    </p>
                    {paymentData.serviceType === 'stringing' && (
                      <Badge className="mt-1 bg-gradient-to-r from-brand-orange to-brand-red text-white">
                        Same Day Delivery
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Service Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customer Name:</span>
                    <span className="font-medium text-gray-900">{paymentData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">
                      {paymentData.address}
                    </span>
                  </div>
                  {paymentData.serviceType === 'repair' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Racquet Name:</span>
                        <span className="font-medium text-gray-900">{paymentData.racquetName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Photos Uploaded:</span>
                        <span className="font-medium text-gray-900">{paymentData.photoCount || 0}</span>
                      </div>
                    </>
                  )}
                  {paymentData.serviceType === 'stringing' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">String Type:</span>
                        <span className="font-medium text-gray-900">{paymentData.stringName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tension:</span>
                        <span className="font-medium text-gray-900">{paymentData.tension} lbs</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div>
            <Card className="border-2 border-brand-orange/30 bg-white shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {paymentData.serviceType === 'repair' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Repair Service:</span>
                        <span className="font-medium text-gray-900">₹{PRICING.repair}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping Charges:</span>
                        <span className="font-medium text-gray-900">₹{PRICING.shipping}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stringing Service:</span>
                        <span className="font-medium text-gray-900">₹{PRICING.stringing}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Same Day Delivery:</span>
                        <span className="font-medium text-green-600">FREE</span>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>₹{total}</span>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  variant="brand"
                  size="lg"
                  className="w-full animate-pulse-glow"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pay ₹{total}
                    </span>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
