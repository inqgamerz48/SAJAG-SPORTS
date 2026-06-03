'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

import { motion, AnimatePresence } from 'framer-motion'

interface BeforeAfterImage {
  id: number
  before: string
  after: string
  title?: string
  description?: string
}

interface BeforeAfterSliderProps {
  images: BeforeAfterImage[]
}

export function BeforeAfterSlider({ images }: BeforeAfterSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const currentImage = images[currentIndex]

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setSliderPosition(50) // Reset slider position
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setSliderPosition(50) // Reset slider position
  }

  return (
    <div className="w-full">
      {/* Image Counter */}
      {images.length > 1 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-500">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevImage}
              className="rounded-full bg-white p-2 shadow-md border border-slate-100 transition-all hover:bg-slate-50 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={nextImage}
              className="rounded-full bg-white p-2 shadow-md border border-slate-100 transition-all hover:bg-slate-50 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>
      )}

      {/* Before/After Slider Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            ref={sliderRef}
            className="relative h-[400px] w-full overflow-hidden md:h-[450px]"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
          >
            {/* After Image (Full) */}
            <div className="absolute inset-0">
              <Image
                src={currentImage.after}
                alt="After repair"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Before Image (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <Image
                src={currentImage.before}
                alt="Before repair"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Slider Handle */}
              <div
                className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-white shadow-lg transition-all active:cursor-grabbing active:scale-110 flex items-center justify-center border border-slate-100"
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="flex gap-1.5 items-center">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute left-4 top-4 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
              Before
            </div>
            <div className="absolute right-4 top-4 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
              After
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image Info */}
      {currentImage.title && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">{currentImage.title}</h3>
          {currentImage.description && (
            <p className="mt-1 text-sm text-gray-600">{currentImage.description}</p>
          )}
        </div>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setSliderPosition(50)
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-brand-orange' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
