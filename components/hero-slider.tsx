'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

const slides = [
  {
    id: 1,
    image: '/hero main.png',
    title: 'India\'s Premium Badminton Store is Getting an Upgrade',
    subtitle: 'Our full range of Rackets, Shoes, and Gear will be online soon.',
    overlay: true,
    showServiceNote: true,
  },
  {
    id: 2,
    image: '/hero main.png',
    title: 'Same Day Stringing Service',
    subtitle: 'Pune City Only - Pickup & Drop Available',
    overlay: true,
    showServiceNote: false,
    highlightBadge: 'Same Day Delivery',
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Auto-advance every 5 seconds

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={slide.image}
              alt="Hero background"
              fill
              className="object-cover"
              priority
            />
            {slide.overlay && (
              <div className="absolute inset-0 bg-black/50" />
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full items-center justify-center px-4">
            <div className="mx-auto max-w-4xl text-center text-white">
              <h1 className="mb-4 text-4xl font-bold md:text-6xl lg:text-7xl">
                {slide.title}
              </h1>
              <p className="mb-8 text-xl md:text-2xl text-gray-200">
                {slide.subtitle}
              </p>
              {slide.highlightBadge && (
                <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-brand-orange to-brand-red px-6 py-3 shadow-lg animate-pulse-glow">
                  <span className="text-lg font-bold text-white">{slide.highlightBadge}</span>
                </div>
              )}
              {slide.showServiceNote && (
                <p className="mb-8 text-lg font-semibold text-white bg-black/30 backdrop-blur-sm inline-block px-6 py-2 rounded-full">
                  Sales are paused, but our services are active!
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={scrollToServices}
                  className="text-lg px-8 py-6 animate-pulse-glow"
                >
                  Explore Our Services
                </Button>
                {slide.highlightBadge && (
                  <Button
                    asChild
                    variant="brand"
                    size="lg"
                    className="text-lg px-8 py-6 animate-pulse-glow"
                  >
                    <Link href="/book?service=stringing">Book Stringing Service</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
