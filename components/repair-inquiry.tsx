'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export function RepairInquiry() {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5)) // Max 5 files
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
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just log to console
    console.log('Form submitted:', { name, mobile, files })
    // TODO: Integrate with backend API
    alert('Request submitted! We will contact you shortly.')
    setName('')
    setMobile('')
    setFiles([])
  }

  return (
    <section id="services" className="py-20 px-4 bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in-up">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Professional Racket Repair & Stringing
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Form Section */}
          <div className="animate-fade-in-up">
            <Card className="border-2 border-brand-orange/30 bg-white shadow-lg">
              <CardContent className="p-8">
                <h3 className="mb-6 text-2xl font-bold text-gray-900">
                  Request Assessment
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input */}
                  <div>
                    <Label htmlFor="name" className="text-gray-700">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-2"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Mobile Input */}
                  <div>
                    <Label htmlFor="mobile" className="text-gray-700">
                      Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      className="mt-2"
                      placeholder="Enter your mobile number"
                      pattern="[0-9]{10}"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <Label className="text-gray-700">Upload Images</Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-2 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${isDragging
                          ? 'border-brand-orange bg-brand-orange/10 brand-glow-orange'
                          : 'border-gray-300 bg-gray-50 hover:border-brand-orange hover:bg-blue-50'
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
                        Click or drag to upload
                      </p>
                      <p className="text-center text-xs text-gray-500">
                        Upload photos of your broken racket frame or string condition
                      </p>
                      <p className="mt-2 text-center text-xs text-gray-400">
                        (Max 5 images)
                      </p>
                    </div>

                    {/* Preview Uploaded Files */}
                    {files.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {files.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  >
                    Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Content Section */}
          <div className="space-y-6 animate-slide-in-right">
            {/* Paragraph 1: Precision Stringing */}
            <div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">
                Precision Stringing
              </h3>
              <p className="leading-relaxed text-gray-700">
                Is your badminton racket in need of repair or restoration? At Sajag Sports, we provide top-notch racket repair services to help you get back on the court with confidence. Whether it&apos;s fixing a damaged frame, replacing grips, or restoring its overall structure, our experts ensure your racket performs like new.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Our specialized gutting badminton racket service uses advanced techniques to replace worn-out strings with precision, enhancing your racket&apos;s performance. With the right tension and premium badminton strings, your game can reach new levels of power and accuracy. We use state-of-the-art digital stringing machines that guarantee tension accuracy, ensuring every string job meets professional standards. Our certified stringers work with a wide range of premium strings from leading brands like Yonex, Li-Ning, and Victor, allowing you to customize your racket for power, control, or durability.
              </p>
            </div>

            {/* Paragraph 2: Structural Repair */}
            <div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">
                Structural Repair
              </h3>
              <p className="leading-relaxed text-gray-700">
                Racket repairs go beyond just string replacement. We focus on addressing frame cracks, loose joints, and grip wear that can hinder your performance. Our team uses cutting-edge tools, including advanced stringing machines, to inspect and repair your racket thoroughly. From minor adjustments to comprehensive racket repair, we restore your equipment to its best condition.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Don&apos;t throw away your broken racket. Our expert technicians specialize in carbon fiber frame restoration, using advanced molding technology to repair frame cracks and loose joints. We can perform invisible crack repairs where possible, ensuring your racket maintains its structural integrity and performance. Additionally, we offer complete grip and grommet replacement services, giving your racket a fresh feel and extended lifespan.
              </p>
            </div>

            {/* Paragraph 3: Trust & Speed */}
            <div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">
                Trust & Speed
              </h3>
              <p className="leading-relaxed text-gray-700">
                Maintaining your badminton racket is crucial for consistent gameplay. A well-repaired racket not only improves durability but also enhances control and stability on the court. At Sajag Sports, we understand the importance of reliable racket repair and provide expert services tailored to your needs.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Trust Sajag Sports to handle all your racket repair requirements. With our efficient service, affordable pricing, and expert craftsmanship, we make it easy to extend the life of your equipment. Whether you need frame repairs, grip replacement, or a complete racket overhaul, we&apos;ve got you covered. Our turnaround time is optimized for your convenience, with same-day express stringing available for urgent needs. We cater to players of all skill levels, ensuring every repair meets professional standards and helps you stay ahead in the game with our dependable racket repair and maintenance services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
