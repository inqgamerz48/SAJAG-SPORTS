'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { Trash2, Loader2, CheckCircle2, XCircle, Camera } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { UploadDropzone } from '@/utils/uploadthing'

interface RacquetData {
  id: string
  brand: string
  model: string
  tension_lbs: number
  stringType: string
  racquetValueCategory: 'A' | 'B'
  numberOfCracks: string
  comments: string
  repairImageUrl?: string
}

interface ContactInfo {
  name: string
  email: string
  phone: string
  pincode: string
}

export function RepairForm() {
  const router = useRouter()
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    email: '',
    phone: '',
    pincode: '',
  })

  const createEmptyRacquet = (): RacquetData => ({
    id: Math.random().toString(36).substring(7),
    brand: '',
    model: '',
    tension_lbs: 24,
    stringType: 'BG 65',
    racquetValueCategory: 'A',
    numberOfCracks: '1',
    comments: '',
  })

  const [racquets, setRacquets] = useState<RacquetData[]>([createEmptyRacquet()])
  const [loading, setLoading] = useState(false)
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [pincodeMessage, setPincodeMessage] = useState('')

  const { user, openAuthModal } = useAuth()
  const { addItem } = useCartStore()

  // Real-time Pincode Validation
  useEffect(() => {
    const pincode = contactInfo.pincode

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
  }, [contactInfo.pincode])

  const handleUpdateRacquet = (id: string, updates: Partial<RacquetData>) => {
    setRacquets(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const handleAddRacquet = () => {
    if (racquets.length >= 10) {
      toast.error('You can only submit up to 10 racquets per order.')
      return
    }
    setRacquets(prev => [...prev, createEmptyRacquet()])
  }

  const handleRemoveRacquet = (id: string) => {
    if (racquets.length === 1) return
    setRacquets(prev => prev.filter(r => r.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validation
    const pincode = contactInfo.pincode
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode.')
      return
    }

    const missingPhoto = racquets.some(r => !r.repairImageUrl)
    if (missingPhoto) {
      toast.error('Please upload a photo for all racquets.')
      return
    }

    // Check if brand/model is filled for all racquets
    const missingDetails = racquets.some(r => !r.brand.trim() || !r.model.trim())
    if (missingDetails) {
      toast.error('Please enter the brand and model for all racquets.')
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

      // 3. Add ALL racquets to Cart Store
      racquets.forEach((racquet) => {
        let basePrice = racquet.racquetValueCategory === 'A' ? 500 : 700
        let stringPrice = racquet.stringType ? STRING_PRICES[racquet.stringType as keyof typeof STRING_PRICES] || 0 : 0

        const totalPrice = (basePrice * parseInt(racquet.numberOfCracks)) + stringPrice

        addItem({
          name: `${racquet.brand} ${racquet.model} Repair`,
          price: totalPrice,
          quantity: 1,
          type: 'service',
          serviceType: 'repair',
          racquetBrand: racquet.brand,
          racquetModel: racquet.model,
          tension: racquet.tension_lbs,
          customerName: contactInfo.name,
          customerEmail: contactInfo.email,
          customerPhone: contactInfo.phone,
          customerPincode: contactInfo.pincode,
          comments: racquet.comments,
          repairImageUrl: racquet.repairImageUrl
        })
      })

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

            {/* Left Column: Personal Details (Shared) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Contact Details</h3>

              <div>
                <Label htmlFor="repair-name" className="text-gray-700">Full Name *</Label>
                <Input
                  id="repair-name"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
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
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
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
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
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
                  value={contactInfo.pincode}
                  onChange={(e) => setContactInfo({ ...contactInfo, pincode: e.target.value.replace(/\D/g, '') })}
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

            {/* Right Column: Multiple Racquets */}
            <div className="space-y-8">
              {racquets.map((racquet, index) => (
                <div key={racquet.id} className="relative p-6 border-2 border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-brand-blue">Racquet {index + 1}</h3>
                    {racquets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRacquet(racquet.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`brand-${racquet.id}`} className="text-gray-700">Brand *</Label>
                        <Input
                          id={`brand-${racquet.id}`}
                          value={racquet.brand}
                          onChange={(e) => handleUpdateRacquet(racquet.id, { brand: e.target.value })}
                          required
                          className="mt-1 bg-white"
                          placeholder="e.g. Yonex"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`model-${racquet.id}`} className="text-gray-700">Model *</Label>
                        <Input
                          id={`model-${racquet.id}`}
                          value={racquet.model}
                          onChange={(e) => handleUpdateRacquet(racquet.id, { model: e.target.value })}
                          required
                          className="mt-1 bg-white"
                          placeholder="e.g. Astrox 100ZZ"
                        />
                      </div>
                    </div>

                    {/* Pricing Fields */}
                    <div className="p-4 bg-white rounded-lg space-y-4 border border-gray-200">
                      <div>
                        <Label className="text-gray-700">Racquet Value Category *</Label>
                        <RadioGroup
                          value={racquet.racquetValueCategory}
                          onValueChange={(val: 'A' | 'B') => handleUpdateRacquet(racquet.id, { racquetValueCategory: val })}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id={`cat-a-${racquet.id}`} />
                            <Label htmlFor={`cat-a-${racquet.id}`} className="font-normal">
                              Below ₹5,000 <span className="text-brand-orange font-bold">(₹500/crack)</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id={`cat-b-${racquet.id}`} />
                            <Label htmlFor={`cat-b-${racquet.id}`} className="font-normal">
                              Above ₹5,000 <span className="text-brand-orange font-bold">(₹700/crack)</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label htmlFor={`cracks-${racquet.id}`} className="text-gray-700">Number of Cracks *</Label>
                        <Select
                          value={racquet.numberOfCracks}
                          onValueChange={(val) => handleUpdateRacquet(racquet.id, { numberOfCracks: val })}
                        >
                          <SelectTrigger id={`cracks-${racquet.id}`} className="mt-1 bg-white">
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

                      {/* Upload Photo Section */}
                      <div>
                        <Label className="text-gray-700 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-brand-orange" />
                          Upload Photo of the Broken Racquet *
                        </Label>
                        <p className="text-xs text-gray-500 mb-2">Max limit 4MB. Take a clear photo of the crack.</p>

                        {racquet.repairImageUrl ? (
                          <div className="relative w-full h-48 mt-2 rounded-xl overflow-hidden border border-gray-200">
                            <Image
                              src={racquet.repairImageUrl}
                              alt="Broken Racquet"
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-sm"
                              onClick={() => handleUpdateRacquet(racquet.id, { repairImageUrl: undefined })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl bg-white hover:border-brand-orange/50 transition-colors">
                            <UploadDropzone
                              endpoint="repairImage"
                              onClientUploadComplete={(res) => {
                                if (res?.[0]) {
                                  handleUpdateRacquet(racquet.id, { repairImageUrl: res[0].url })
                                  toast.success("Photo uploaded successfully!")
                                }
                              }}
                              onUploadError={(error: Error) => {
                                toast.error(`Upload failed: ${error.message}`)
                              }}
                              appearance={{
                                button: "bg-brand-orange text-white hover:bg-brand-orange/90 rounded-md py-2 px-4 shadow-sm",
                                container: "py-6 px-4 flex flex-col items-center justify-center space-y-3 cursor-pointer",
                                label: "text-brand-orange font-semibold tracking-wide hover:text-brand-orange/80",
                                allowedContent: "text-gray-500 text-xs mt-1"
                              }}
                              content={{
                                label: "Upload from Library or Camera",
                                allowedContent: "Image (max 4MB)"
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`string-choice-${racquet.id}`} className="text-gray-700">Stringing Choice *</Label>
                        <Select
                          value={racquet.stringType}
                          onValueChange={(val) => handleUpdateRacquet(racquet.id, { stringType: val })}
                        >
                          <SelectTrigger id={`string-choice-${racquet.id}`} className="mt-1 bg-white">
                            <SelectValue placeholder="Select string" />
                          </SelectTrigger>
                          <SelectContent>
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
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor={`tension-${racquet.id}`} className="text-gray-700">Tension (lbs)</Label>
                        <Input
                          id={`tension-${racquet.id}`}
                          type="number"
                          min="17"
                          max="35"
                          value={racquet.tension_lbs}
                          onChange={(e) => handleUpdateRacquet(racquet.id, { tension_lbs: parseInt(e.target.value) || 24 })}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      * Max safe tension for repaired racquets is 24-26 lbs.
                    </p>

                    <div>
                      <Label htmlFor={`comments-${racquet.id}`} className="text-gray-700">Comments / Description</Label>
                      <Textarea
                        id={`comments-${racquet.id}`}
                        value={racquet.comments}
                        onChange={(e) => handleUpdateRacquet(racquet.id, { comments: e.target.value })}
                        className="mt-2 text-gray-700 bg-white"
                        placeholder="Additional details about the repair"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {racquets.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-2 text-brand-blue hover:text-brand-blue/80 hover:bg-blue-50"
                  onClick={handleAddRacquet}
                >
                  + Add Another Racquet
                </Button>
              )}
            </div>
          </div>



          {/* Pricing Estimation Bottom Bar */}
          <div className="bg-gray-50 border-t p-6 rounded-b-xl border border-gray-200 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Expected Total for {racquets.length} Racquet{racquets.length > 1 ? 's' : ''}:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  racquets.reduce((total, r) => {
                    let base = r.racquetValueCategory === 'A' ? 500 : 700;
                    let string = r.stringType ? STRING_PRICES[r.stringType as keyof typeof STRING_PRICES] || 0 : 0;
                    return total + ((base * parseInt(r.numberOfCracks || '1')) + string);
                  }, 0)
                )}
              </span>
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full text-lg py-6 shadow-xl animate-pulse-glow bg-brand-orange hover:bg-brand-orange/90"
              disabled={loading || checkingPincode || pincodeStatus === 'invalid'}
            >
              {loading ? 'Calculating Quote...' : 'Confirm Items & Proceed to Cart'}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
