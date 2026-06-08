'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertCircle, RotateCcw, Save } from 'lucide-react'

export default function SettingsPage() {
  const [priceA, setPriceA] = useState('550')
  const [priceB, setPriceB] = useState('850')
  const [threshold, setThreshold] = useState('4000')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.success) {
          setPriceA(String(data.price_per_crack_below_threshold ?? data.priceA ?? '550'))
          setPriceB(String(data.price_per_crack_above_threshold ?? data.priceB ?? '850'))
          setThreshold(String(data.racquet_value_threshold ?? data.threshold ?? '4000'))
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
        toast.error('Failed to load pricing settings from server')
      } finally {
        setInitialLoading(false)
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
      const itemsToSave = [
        { key: 'price_per_crack_below_threshold', value: numPriceA },
        { key: 'price_per_crack_above_threshold', value: numPriceB },
        { key: 'racquet_value_threshold', value: numThreshold }
      ]

      // Save settings sequentially as requested in spec
      for (const item of itemsToSave) {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: item.key, value: item.value }),
        })
        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error || `Failed to save setting: ${item.key}`)
        }
      }

      toast.success('Pricing settings saved successfully')
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      toast.error(err.message || 'Failed to save settings')
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
        setPriceA(String(data.price_per_crack_below_threshold ?? data.priceA ?? '550'))
        setPriceB(String(data.price_per_crack_above_threshold ?? data.priceB ?? '850'))
        setThreshold(String(data.racquet_value_threshold ?? data.threshold ?? '4000'))
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

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure pricing policies and checkout defaults.</p>
      </div>
      
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold text-gray-900">Repair Pricing Settings</CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            Configure the base repair prices per crack and racquet value categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="threshold-val" className="text-sm font-semibold text-gray-700">Racquet Value Threshold (₹)</Label>
              <Input
                id="threshold-val"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1.5 focus:border-amber-500 focus:ring-amber-500"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Threshold value determining Category A vs Category B (Default: 4000)
              </p>
            </div>

            <div>
              <Label htmlFor="price-a" className="text-sm font-semibold text-gray-700">
                Category A (Value &lt; ₹{Number(threshold || 0).toLocaleString('en-IN')}) Price per crack (₹)
              </Label>
              <Input
                id="price-a"
                type="number"
                value={priceA}
                onChange={(e) => setPriceA(e.target.value)}
                className="mt-1.5 focus:border-amber-500 focus:ring-amber-500"
                disabled={loading}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price-b" className="text-sm font-semibold text-gray-700">
                Category B (Value &ge; ₹{Number(threshold || 0).toLocaleString('en-IN')}) Price per crack (₹)
              </Label>
              <Input
                id="price-b"
                type="number"
                value={priceB}
                onChange={(e) => setPriceB(e.target.value)}
                className="mt-1.5 focus:border-amber-500 focus:ring-amber-500"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-800 flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Note on dynamic checkout calculations:</span>
              Updating these values affects repair calculation pages and booking cart items added from this point forward.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium shadow-sm flex items-center justify-center gap-2" 
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2 font-medium" 
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 text-gray-500" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
