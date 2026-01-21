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

interface StringingFormData {
  name: string
  address: string
  stringName: string
  tension: number[]
}

const stringOptions = [
  'BG65',
  'BG80',
  'BG95',
  'Exbolt 63',
  'Exbolt 65',
  'Aerobite',
  'Aerosonic',
  'Li-Ning No.1',
  'Victor VBS-66N',
]

export function StringingForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<StringingFormData>({
    name: '',
    address: '',
    stringName: '',
    tension: [24],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Store form data in sessionStorage to pass to payment page
    const formDataToStore = {
      serviceType: 'stringing',
      name: formData.name,
      address: formData.address,
      stringName: formData.stringName,
      tension: formData.tension[0],
    }
    
    sessionStorage.setItem('stringingFormData', JSON.stringify(formDataToStore))
    
    // Redirect to payment page
    router.push('/payment')
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

          {/* Address */}
          <div>
            <Label htmlFor="stringing-address" className="text-gray-700">
              Complete Address (Pune City Only) *
            </Label>
            <textarea
              id="stringing-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your complete address including pincode (Pune only)"
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

          {/* Submit Button */}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full animate-pulse-glow"
            disabled={loading || !formData.stringName}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
