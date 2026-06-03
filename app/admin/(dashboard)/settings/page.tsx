'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [priceA, setPriceA] = useState('500')
  const [priceB, setPriceB] = useState('700')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.success) {
          setPriceA(String(data.priceA))
          setPriceB(String(data.priceB))
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceA, priceB }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Pricing settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Repair Pricing</CardTitle>
          <CardDescription>
            Update the base repair prices per crack for different racquet value categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="price-a">Category A (Value &lt; ₹5,000) Price per crack (₹)</Label>
              <Input
                id="price-a"
                type="number"
                value={priceA}
                onChange={(e) => setPriceA(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="price-b">Category B (Value &ge; ₹5,000) Price per crack (₹)</Label>
              <Input
                id="price-b"
                type="number"
                value={priceB}
                onChange={(e) => setPriceB(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full sm:w-auto" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
