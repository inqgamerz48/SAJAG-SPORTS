'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Package, CreditCard, Loader2, AlertCircle } from 'lucide-react'

interface PaymentData {
  serviceType: 'repair' | 'stringing'
  name: string
  email?: string
  phone?: string
  address: string
  racquetName?: string
  racketValue?: number
  crackCount?: number
  stringType?: 'none' | 'BG65' | 'BG65_TI'
  stringName?: string
  tension?: number
  photoCount?: number
  products?: string[]
}

interface CostBreakdown {
  serviceCost: number
  repairCost: number
  stringCost: number
  shippingCost: number
  legA: number
  legB: number
  subtotal: number
  total: number
  serviceDescription?: string
  shippingMessage?: string
}

export default function PaymentPage() {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get form data from sessionStorage
    const repairData = sessionStorage.getItem('repairFormData')
    const stringingData = sessionStorage.getItem('stringingFormData')

    if (repairData) {
      const data = JSON.parse(repairData)
      setPaymentData(data)
      // Calculate costs for repair service
      calculateRepairCosts(data)
    } else if (stringingData) {
      setPaymentData(JSON.parse(stringingData))
      // Stringing service - fixed pricing (no shipping, no GST for now)
      setCostBreakdown({
        serviceCost: 300,
        repairCost: 0,
        stringCost: 0,
        shippingCost: 0,
        legA: 0,
        legB: 0,
        subtotal: 300,
        total: 300,
      })
    } else {
      router.push('/book')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const extractPincode = (address: string): string | null => {
    const pincodeMatch = address.match(/\b\d{6}\b/)
    return pincodeMatch ? pincodeMatch[0] : null
  }

  const calculateRepairCosts = async (data: PaymentData) => {
    if (data.serviceType !== 'repair') return

    setCalculating(true)
    setError(null)

    const pincode = extractPincode(data.address)

    if (!pincode) {
      setError('Please include a valid 6-digit pincode in your address to calculate shipping')
      setCalculating(false)
      return
    }

    if (!data.racketValue) {
      setError('Racket value is required for pricing')
      setCalculating(false)
      return
    }

    setError(null)

    try {
      const response = await fetch('/api/calculate-total', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: 'repair',
          customerPincode: pincode,
          racketValue: data.racketValue,
          crackCount: data.crackCount ?? 1,
          stringType: data.stringType || 'none',
        }),
      })

      const result = await response.json()

      if (result.success && result.breakdown) {
        setCostBreakdown(result.breakdown)
        setError(null)
      } else {
        setError(result.error || 'Failed to calculate total')
      }
    } catch (err) {
      console.error('Error calculating costs:', err)
      setError('Failed to calculate shipping. Please try again.')
    } finally {
      setCalculating(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentData || !costBreakdown) return

    setLoading(true)

    try {
      // Create session/order and get PayU hash on server
      const response = await fetch('/api/payu/create-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentData,
          costBreakdown,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to PayU by submitting a hidden form
      const payuUrl = process.env.NEXT_PUBLIC_PAYU_ENV === 'prod'
        ? 'https://secure.payu.in/_payment'
        : 'https://test.payu.in/_payment'

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payuUrl

      const fields = {
        key: data.merchantKey,
        txnid: data.txnid,
        amount: data.amount,
        productinfo: data.productinfo,
        firstname: data.firstname,
        email: data.email,
        phone: paymentData.phone || '',
        surl: data.surl,
        furl: data.furl,
        hash: data.hash,
        udf1: data.udf1,
      }

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
      setLoading(false)
    }
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-orange" />
            <p className="text-gray-600">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment</h1>
            <p className="text-gray-600">Review your order and proceed to payment</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pricing Reference Table */}
              {paymentData.serviceType === 'repair' && (
                <Card className="border-2 border-brand-orange/30 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Service Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-3 py-2 text-left font-semibold text-gray-900">Service</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr className={paymentData.racketValue && paymentData.racketValue < 5000 && (!paymentData.stringType || paymentData.stringType === 'none') ? 'bg-brand-orange/10' : ''}>
                            <td className="px-3 py-2 text-gray-700">
                              <span className="font-medium">Repair Only (Below ₹5,000)</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">₹499</td>
                          </tr>
                          <tr className={paymentData.racketValue && paymentData.racketValue >= 5000 && (!paymentData.stringType || paymentData.stringType === 'none') ? 'bg-brand-orange/10' : ''}>
                            <td className="px-3 py-2 text-gray-700">
                              <span className="font-medium">Repair Only (Above ₹5,000)</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">₹599</td>
                          </tr>
                          <tr className={paymentData.stringType === 'BG65' ? 'bg-brand-blue/10' : ''}>
                            <td className="px-3 py-2 text-gray-700">
                              <span className="font-medium">BG 65 – Repair + Stringing</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">₹650</td>
                          </tr>
                          <tr className={paymentData.stringType === 'BG65_TI' ? 'bg-brand-orange/10' : ''}>
                            <td className="px-3 py-2 text-gray-700">
                              <span className="font-medium">BG 65 Titanium – Repair + Stringing</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">₹700</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      * Shipping calculated separately based on your pincode (Shiprocket).
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-gray-200 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        {paymentData.racketValue && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Racket Value:</span>
                            <span className="font-medium text-gray-900">₹{paymentData.racketValue.toLocaleString()}</span>
                          </div>
                        )}
                        {paymentData.crackCount && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Crack Count (Reference):</span>
                            <span className="font-medium text-gray-900">{paymentData.crackCount}</span>
                          </div>
                        )}
                        {paymentData.stringType && paymentData.stringType !== 'none' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">String Type:</span>
                            <span className="font-medium text-gray-900">
                              {paymentData.stringType === 'BG65' ? 'BG65' : 'BG65 Titanium'}
                            </span>
                          </div>
                        )}
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
                  {calculating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-orange mr-2" />
                      <span className="text-sm text-gray-600">Calculating shipping...</span>
                    </div>
                  ) : error && !costBreakdown ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Shipping Unavailable</p>
                          <p className="text-xs text-red-700 mt-1">{error}</p>
                          <p className="text-xs text-red-700 mt-2">
                            You can choose to self-ship the racquet to our workshop.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : costBreakdown ? (
                    <>
                      <div className="space-y-2">
                        {paymentData.serviceType === 'repair' && (
                          <>
                            {/* Itemized: Repair (Labour) + String when applicable */}
                            {costBreakdown.repairCost > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {costBreakdown.stringCost > 0 ? 'Repair (by racquet value)' : (costBreakdown.serviceDescription || 'Service')}
                                </span>
                                <span className="font-medium text-gray-900">₹{costBreakdown.repairCost.toFixed(2)}</span>
                              </div>
                            )}
                            {costBreakdown.stringCost > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {paymentData.stringType === 'BG65_TI' ? 'BG65 Titanium Stringing' : 'BG65 Stringing'}
                                </span>
                                <span className="font-medium text-gray-900">₹{costBreakdown.stringCost.toFixed(2)}</span>
                              </div>
                            )}
                            {costBreakdown.repairCost === 0 && costBreakdown.stringCost === 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{costBreakdown.serviceDescription || 'Service'}</span>
                                <span className="font-medium text-gray-900">₹{costBreakdown.serviceCost.toFixed(2)}</span>
                              </div>
                            )}
                            {/* Shiprocket round-trip shipping */}
                            {costBreakdown.shippingCost > 0 && (
                              <>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Pickup (Leg A):</span>
                                  <span>₹{costBreakdown.legA.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Delivery (Leg B):</span>
                                  <span>₹{costBreakdown.legB.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Shipping (Round Trip):</span>
                                  <span className="font-medium text-gray-900">₹{costBreakdown.shippingCost.toFixed(2)}</span>
                                </div>
                                {(costBreakdown as any).shippingGst > 0 && (
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>GST on Shipping (18%):</span>
                                    <span>₹{(costBreakdown as any).shippingGst.toFixed(2)}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {costBreakdown.shippingMessage && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                                {costBreakdown.shippingMessage}
                              </div>
                            )}
                          </>
                        )}
                        {paymentData.serviceType === 'stringing' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Stringing Service</span>
                            <span className="font-medium text-gray-900">₹{costBreakdown.serviceCost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        {paymentData.products && paymentData.products.length > 0 && (
                          <div className="mb-4 pt-2 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-900 mb-2">Add-ons:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {paymentData.products.map((pid, idx) => (
                                <li key={idx}>Product ID: {pid} (Added)</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium text-gray-900">₹{costBreakdown.serviceCost.toFixed(2)}</span>
                        </div>
                        {costBreakdown.shippingCost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-medium text-gray-900">₹{costBreakdown.shippingCost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total:</span>
                        <span>₹{costBreakdown.total.toFixed(2)}</span>
                      </div>

                      <Button
                        onClick={handlePayment}
                        disabled={loading || calculating}
                        variant="brand"
                        size="lg"
                        className="w-full animate-pulse-glow"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Pay ₹{costBreakdown.total.toFixed(2)}
                          </span>
                        )}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Secure payment powered by PayU
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Loading cost breakdown...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
