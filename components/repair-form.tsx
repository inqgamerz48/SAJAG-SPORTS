'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Upload, X } from 'lucide-react'

interface RepairFormData {
  name: string
  address: string
  racquetName: string
  photos: File[]
}

export function RepairForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<RepairFormData>({
    name: '',
    address: '',
    racquetName: '',
    photos: [],
  })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newFiles].slice(0, 5), // Max 5 files
      }))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Store form data in sessionStorage to pass to payment page
    const formDataToStore = {
      serviceType: 'repair',
      name: formData.name,
      address: formData.address,
      racquetName: formData.racquetName,
      photoCount: formData.photos.length,
    }
    
    sessionStorage.setItem('repairFormData', JSON.stringify(formDataToStore))
    
    // Redirect to payment page
    router.push('/payment')
  }

  return (
    <Card className="border-2 border-brand-orange/30 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Racquet Repair Request</CardTitle>
        <CardDescription className="text-gray-600">
          Fill in the details below to request a repair service. We&apos;ll provide pickup service for your racquet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="repair-name" className="text-gray-700">
              Full Name *
            </Label>
            <Input
              id="repair-name"
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
            <Label htmlFor="repair-address" className="text-gray-700">
              Complete Address *
            </Label>
            <textarea
              id="repair-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your complete address including pincode"
            />
          </div>

          {/* Racquet Name */}
          <div>
            <Label htmlFor="racquet-name" className="text-gray-700">
              Racquet Name/Model *
            </Label>
            <Input
              id="racquet-name"
              type="text"
              value={formData.racquetName}
              onChange={(e) => setFormData({ ...formData, racquetName: e.target.value })}
              required
              className="mt-2"
              placeholder="e.g., Yonex Astrox 88D"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="text-gray-700">Upload Racquet Photos *</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                isDragging
                  ? 'border-brand-orange bg-brand-orange/10 brand-glow-orange'
                  : 'border-gray-300 bg-gray-50 hover:border-brand-orange hover:bg-gray-100'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Upload className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-center text-sm font-medium text-gray-700">
                Click or drag to upload photos
              </p>
              <p className="text-center text-xs text-gray-500">
                Upload photos showing the damage/repair needed (Max 5 images)
              </p>
            </div>

            {/* Preview Uploaded Files */}
            {formData.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {formData.photos.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-600">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full animate-pulse-glow"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
