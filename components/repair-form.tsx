'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { STRING_PRICES, formatCurrency } from '@/lib/pricing'
import { useAuth } from '@/components/providers/auth-provider'
import { useCartStore } from '@/store/useCartStore'
import { Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface RepairFormData {
  name: string
  email: string
  phone: string
  pincode: string
  serviceType: 'Stringing' | 'Frame Repair'
  brand: string
  model: string
  tension_lbs: number
  knot_type: '2-knot' | '4-knot'
  stringType: string
  racquetValueCategory: 'A' | 'B'
  numberOfCracks: string
}

export function RepairForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<RepairFormData>({
    name: '',
    email: '',
    phone: '',
    pincode: '',
    serviceType: 'Frame Repair', // Default to Frame Repair
    brand: '',
    model: '',
    tension_lbs: 24,
    knot_type: '4-knot',
    stringType: 'none',
    racquetValueCategory: 'A',
    numberOfCracks: '1',
  })
  const [loading, setLoading] = useState(false)
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [pincodeMessage, setPincodeMessage] = useState('')

  const { user, openAuthModal } = useAuth()
  const { addItem } = useCartStore()

  // Real-time Pincode Validation
  useEffect(() => {
    const pincode = formData.pincode

    if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      const checkServiceability = async () => {
        setCheckingPincode(true)
        setPincodeStatus('idle')

        try {
          const res = await fetch('/api/calculate-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pincode })
          })
          const data = await res.json()

          if (data.success && data.serviceable) {
            setPincodeStatus('valid')
            setPincodeMessage(`Service available! ${data.rates?.courier_name ? `(${data.rates.courier_name})` : ''}`)
          } else {
            setPincodeStatus('invalid')
            setPincodeMessage(data.error || 'Shipping not available for this pincode')
          }
        } catch (error) {
          setPincodeStatus('invalid')
          setPincodeMessage('Error checking serviceability')
        } finally {
          setCheckingPincode(false)
        }
      }

      // Debounce check to avoid too many API calls while typing
      const timer = setTimeout(checkServiceability, 1000)
      return () => clearTimeout(timer)
    } else {
      setPincodeStatus('idle')
      setPincodeMessage('')
    }
  }, [formData.pincode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Pincode Validation
    const pincode = formData.pincode
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode.')
      return
    }

    setLoading(true)

    try {
      // 2. Check Serviceability
      const checkRes = await fetch(`/api/calculate-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode })
      })
      const checkData = await checkRes.json()

      if (!checkData.success) {
        toast.error(checkData.error || 'Shipping not available for this pincode.')
        setLoading(false)
        return
      }

      // 3. Add to Cart Store instead of direct quote page
      let basePrice = formData.racquetValueCategory === 'A' ? 500 : 700
      let stringPrice = formData.stringType !== 'none' ? STRING_PRICES[formData.stringType as keyof typeof STRING_PRICES] || 0 : 0

      const totalPrice = (basePrice * parseInt(formData.numberOfCracks)) + stringPrice

      addItem({
        name: `${formData.brand} ${formData.model} Repair`,
        price: totalPrice,
        quantity: 1,
        type: 'service',
        serviceType: 'repair',
        racquetBrand: formData.brand,
        racquetModel: formData.model,
        tension: formData.tension_lbs,
        // Carry forward contact info to prefill checkout
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerPincode: formData.pincode
      })

      // Instead of going to checkout, go to the unified /cart to see everything (and hit the upsell!)
      router.push(`/cart`)

    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to process your request. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-brand-orange/30 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Racquet Repair Request</CardTitle>
        <CardDescription className="text-gray-600">
          Professional carbon fibre repair to restore your racket&apos;s performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Important Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">ℹ️ Pricing & Verification</p>
            <p>
              Please accurately select the number of cracks and racquet value.
              <strong> Final verification will be done at the workshop.</strong>
              Discrepancies may require balance payment before return shipping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column: Personal Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Contact Details</h3>

              <div>
                <Label htmlFor="repair-name" className="text-gray-700">Full Name *</Label>
                <Input
                  id="repair-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="repair-email" className="text-gray-700">Email *</Label>
                <Input
                  id="repair-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="repair-phone" className="text-gray-700">Phone (WhatsApp) *</Label>
                <Input
                  id="repair-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <Label htmlFor="repair-pincode" className="text-gray-700">Pickup Pincode *</Label>
                <Input
                  id="repair-pincode"
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  required
                  className="mt-1"
                  placeholder="e.g. 411001"
                />
                {/* Pincode Status Feedback */}
                <div className="mt-2 h-6 text-sm">
                  {checkingPincode && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking serviceability...
                    </div>
                  )}
                  {!checkingPincode && pincodeStatus === 'valid' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {pincodeMessage}
                    </div>
                  )}
                  {!checkingPincode && pincodeStatus === 'invalid' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {pincodeMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Service Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Racquet Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand" className="text-gray-700">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="e.g. Yonex"
                  />
                </div>
                <div>
                  <Label htmlFor="model" className="text-gray-700">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="e.g. Astrox 100ZZ"
                  />
                </div>
              </div>

              {/* Pricing Fields */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">

                <div>
                  <Label className="text-gray-700">Racquet Value Category *</Label>
                  <RadioGroup
                    value={formData.racquetValueCategory}
                    onValueChange={(val: 'A' | 'B') => setFormData({ ...formData, racquetValueCategory: val })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A" id="cat-a" />
                      <Label htmlFor="cat-a" className="font-normal">
                        Below ₹5,000 <span className="text-brand-orange font-bold">(₹500/crack)</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B" id="cat-b" />
                      <Label htmlFor="cat-b" className="font-normal">
                        Above ₹5,000 <span className="text-brand-orange font-bold">(₹700/crack)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="cracks" className="text-gray-700">Number of Cracks *</Label>
                  <Select
                    value={formData.numberOfCracks}
                    onValueChange={(val) => setFormData({ ...formData, numberOfCracks: val })}
                  >
                    <SelectTrigger id="cracks" className="mt-1 bg-white">
                      <SelectValue placeholder="Select number of cracks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Crack</SelectItem>
                      <SelectItem value="2">2 Cracks</SelectItem>
                      <SelectItem value="3">3 Cracks</SelectItem>
                      <SelectItem value="4">4 Cracks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="string-choice" className="text-gray-700">Stringing Choice *</Label>
                  <Select
                    value={formData.stringType}
                    onValueChange={(val) => setFormData({ ...formData, stringType: val })}
                  >
                    <SelectTrigger id="string-choice" className="mt-1 bg-white">
                      <SelectValue placeholder="Select string" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Stringing (₹0)</SelectItem>
                      {Object.entries(STRING_PRICES)
                        .filter(([name]) => name !== 'none')
                        .map(([name, price]) => (
                          <SelectItem key={name} value={name}>
                            {name} ({formatCurrency(price)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Tension */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tension" className="text-gray-700">Tension (lbs)</Label>
                  <Input
                    id="tension"
                    type="number"
                    min="17"
                    max="35"
                    value={formData.tension_lbs}
                    onChange={(e) => setFormData({ ...formData, tension_lbs: parseInt(e.target.value) || 24 })}
                    className="mt-1"
                    disabled={formData.stringType === 'none'}
                  />
                </div>
                <div>
                  <Label htmlFor="knot-type" className="text-gray-700">Knot Type</Label>
                  <Select
                    value={formData.knot_type}
                    onValueChange={(value: '2-knot' | '4-knot') => setFormData({ ...formData, knot_type: value })}
                    disabled={formData.stringType === 'none'}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-knot">2-Knot</SelectItem>
                      <SelectItem value="4-knot">4-Knot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                * Max safe tension for repaired racquets is 24-26 lbs.
              </p>

            </div>
          </div>



          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full text-lg py-6 shadow-xl animate-pulse-glow mt-8 bg-brand-orange hover:bg-brand-orange/90"
            disabled={loading || checkingPincode || pincodeStatus === 'invalid'}
          >
            {loading ? 'Calculating Quote...' : 'Get Quote & Pay'}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
