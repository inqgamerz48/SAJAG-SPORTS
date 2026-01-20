'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

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
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevImage}
              className="rounded-full bg-white p-2 shadow-md transition-all hover:bg-gray-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="rounded-full bg-white p-2 shadow-md transition-all hover:bg-gray-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* Before/After Slider Container */}
      <div
        ref={sliderRef}
        className="relative h-[400px] w-full overflow-hidden rounded-lg border-2 border-gray-200 md:h-[450px]"
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
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-white shadow-lg transition-all active:cursor-grabbing active:scale-110"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex gap-1">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute left-4 top-4 rounded bg-black/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
          Before
        </div>
        <div className="absolute right-4 top-4 rounded bg-black/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
          After
        </div>
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
