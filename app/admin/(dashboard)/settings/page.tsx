'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [priceA, setPriceA] = useState('550')
  const [priceB, setPriceB] = useState('850')
  const [threshold, setThreshold] = useState('4000')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.success) {
          setPriceA(String(data.priceA))
          setPriceB(String(data.priceB))
          setThreshold(String(data.threshold ?? '4000'))
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    const numPriceA = Number(priceA)
    const numPriceB = Number(priceB)
    const numThreshold = Number(threshold)

    // Validation
    if (isNaN(numPriceA) || numPriceA <= 0 || isNaN(numPriceB) || numPriceB <= 0 || isNaN(numThreshold) || numThreshold <= 0) {
      toast.error('All inputs must be positive numbers only')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceA: numPriceA, priceB: numPriceB, threshold: numThreshold }),
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

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all repair pricing to defaults?')) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      })
      const data = await res.json()
      if (data.success) {
        setPriceA(String(data.priceA))
        setPriceB(String(data.priceB))
        setThreshold(String(data.threshold))
        toast.success('Pricing settings reset to defaults')
      } else {
        toast.error(data.error || 'Failed to reset settings')
      }
    } catch (err) {
      console.error('Failed to reset settings:', err)
      toast.error('Failed to reset settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Repair Pricing Settings</CardTitle>
          <CardDescription>
            Configure the base repair prices per crack and racquet value categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="threshold-val">Racquet Value Threshold (₹)</Label>
              <Input
                id="threshold-val"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Threshold value determining Category A vs Category B (Default: 4000)
              </p>
            </div>

            <div>
              <Label htmlFor="price-a">Category A (Value &lt; ₹{Number(threshold).toLocaleString('en-IN')}) Price per crack (₹)</Label>
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
              <Label htmlFor="price-b">Category B (Value &ge; ₹{Number(threshold).toLocaleString('en-IN')}) Price per crack (₹)</Label>
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

          <div className="flex gap-4">
            <Button onClick={handleSave} className="flex-1 sm:flex-initial bg-brand-orange hover:bg-brand-orange/90 text-white" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button onClick={handleReset} variant="outline" className="flex-1 sm:flex-initial text-gray-600 border-gray-300" disabled={loading}>
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
