'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/useCartStore'
import { STRING_PRICES } from '@/lib/pricing'

interface StringingFormData {
  name: string
  email: string
  phone: string
  pincode: string
  stringName: string
  tension: number[]
  comments: string
}

const stringOptions = [
  'BG 65',
  'BG 65 Titanium',
  'BG80 Power',
  'BG66 Ultimax',
]

export function StringingForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<StringingFormData>({
    name: '',
    email: '',
    phone: '',
    pincode: '',
    stringName: '',
    tension: [24],
    comments: '',
  })
  const [loading, setLoading] = useState(false)
  const { addItem } = useCartStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const stringPrice = STRING_PRICES[formData.stringName as keyof typeof STRING_PRICES] || 600

    // Add to unified Cart instead of session storage
    addItem({
      name: `Racquet Stringing - ${formData.stringName}`,
      price: stringPrice,
      quantity: 1,
      type: 'service',
      serviceType: 'stringing',
      tension: formData.tension[0],
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      customerPincode: formData.pincode,
      comments: formData.comments,
    })

    // Redirect to the unified cart page
    router.push('/cart')
  }

  return (
    <Card className="border-2 border-brand-blue/30 bg-white shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Racquet Stringing Service</CardTitle>
            <CardDescription className="text-gray-600">
              Same day delivery available for Pune City only
            </CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-brand-orange to-brand-red text-white px-4 py-1">
            Same Day Delivery
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info text */}
          <div className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-4 text-sm text-gray-700">
            <p className="font-semibold mb-1">24-Hour Pick-Up &amp; Delivery (Pune City)</p>
            <p className="mb-1">
              We provide professional racket stringing services in Pune with fast 24-hour pick-up and delivery.
            </p>
            <p>
              Designed for players who want consistent tension, precision stringing, and zero hassle.
            </p>
          </div>
          {/* Name */}
          <div>
            <Label htmlFor="stringing-name" className="text-gray-700">
              Full Name *
            </Label>
            <Input
              id="stringing-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-2"
              placeholder="Enter your full name"
            />
          </div>
          {/* Email */}
          <div>
            <Label htmlFor="stringing-email" className="text-gray-700">
              Email *
            </Label>
            <Input
              id="stringing-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-2"
              placeholder="your@email.com"
            />
          </div>
          {/* Phone */}
          <div>
            <Label htmlFor="stringing-phone" className="text-gray-700">
              Phone (WhatsApp) *
            </Label>
            <Input
              id="stringing-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="mt-2"
              placeholder="10-digit mobile number"
            />
          </div>

          {/* Pincode */}
          <div>
            <Label htmlFor="stringing-pincode" className="text-gray-700">
              Pickup Pincode (Pune City Only) *
            </Label>
            <Input
              id="stringing-pincode"
              type="text"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
              required
              className="mt-2"
              placeholder="e.g. 411001"
            />
          </div>

          {/* String Name */}
          <div>
            <Label htmlFor="string-name" className="text-gray-700">
              String Type *
            </Label>
            <Select
              value={formData.stringName}
              onValueChange={(value) => setFormData({ ...formData, stringName: value })}
              required
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select string type" />
              </SelectTrigger>
              <SelectContent>
                {stringOptions.map((string) => (
                  <SelectItem key={string} value={string}>
                    {string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tension */}
          <div>
            <Label className="text-gray-700">
              Stringing Tension: {formData.tension[0]} lbs *
            </Label>
            <div className="mt-4 space-y-2">
              <Slider
                value={formData.tension}
                onValueChange={(value) => setFormData({ ...formData, tension: value })}
                min={20}
                max={32}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>20 lbs (Light)</span>
                <span>26 lbs (Medium)</span>
                <span>32 lbs (Tight)</span>
              </div>
              {formData.tension[0] > 28 && (
                <p className="text-sm text-orange-600 font-medium">
                  ⚠️ High tension (&gt;28 lbs) may reduce string durability and is not recommended for repaired rackets.
                </p>
              )}
            </div>
          </div>

          {/* Comments / Description */}
          <div>
            <Label htmlFor="stringing-comments" className="text-gray-700">
              Comments / Description
            </Label>
            <textarea
              id="stringing-comments"
              className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-700"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Any specific requests or details"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full animate-pulse-glow"
            disabled={loading || !formData.stringName}
          >
            {loading ? 'Processing...' : 'Add to Cart'}
          </Button>
        </form>
      </CardContent>
    </Card >
  )
}
