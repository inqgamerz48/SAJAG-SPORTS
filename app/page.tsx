'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/header'
import { HeroSlider } from '@/components/hero-slider'
import { StatsCounter } from '@/components/stats-counter'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle2,
  Package,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Settings,
  Scissors,
  Wrench,
} from 'lucide-react'
import { BeforeAfterSlider } from '@/components/before-after-slider'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Scroll progress indicator for a modern UX touch
  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) {
        setScrollProgress(0)
        return
      }
      const progress = (window.scrollY / scrollable) * 100
      setScrollProgress(Math.min(100, Math.max(0, progress)))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    try {
      const supabaseClient = createClient()
      const { error } = await supabaseClient.from('store_waitlist').insert({ email })
      if (!error) {
        setSubmitted(true)
        setEmail('')
      }
    } catch (error) {
      console.error('Error submitting waitlist:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-brand-orange via-brand-blue to-brand-red transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden
      />
      <Header />

      <HeroSlider />

      <StatsCounter />

      {/* Services Showcase Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center animate-fade-in-up">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Our Services
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Professional racket stringing in Pune and crack repair across India, with clear safety-first tension guidelines.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Stringing Service Card */}
            <Card className="border-2 border-brand-blue/30 bg-white shadow-lg relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-gradient-to-r from-brand-orange to-brand-red text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-pulse-glow">
                  Same Day Delivery
                </span>
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-full bg-brand-blue/10">
                    <Scissors className="h-8 w-8 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Racquet Stringing</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 text-brand-orange" />
                      Pune City Only
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  We provide professional racket stringing services in Pune with fast 24-hour pick-up and delivery. Perfect for players who want consistent tension, precision stringing, and zero hassle.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-blue font-bold">✓</span>
                    24-hour pick-up & delivery in Pune City
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-blue font-bold">✓</span>
                    Accurate tension with professional digital machines
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-blue font-bold">✓</span>
                    Suitable for beginners to tournament players
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-blue font-bold">✓</span>
                    Trusted by club & academy players
                  </li>
                </ul>
                <div className="mb-6 rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-4 text-left text-sm text-gray-700">
                  <p className="font-semibold mb-1">Service Snapshot</p>
                  <p>📍 <span className="font-medium">Service Area:</span> Pune City</p>
                  <p>⏱️ <span className="font-medium">Turnaround Time:</span> Within 24 hours</p>
                </div>
                <Button variant="brand" className="w-full" asChild>
                  <Link href="/book?service=stringing">Book Stringing Service</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Repair Service Card */}
            <Card className="border-2 border-brand-orange/30 bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-full bg-brand-orange/10">
                    <Wrench className="h-8 w-8 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Racquet Repair</h3>
                    <p className="text-sm text-gray-600 mt-1">Pan-India Service</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  We offer crack racket repair services across India. Courier your racket to us, and our experts will repair and return it safely, with clear post-repair tension limits for durability and safety.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-orange font-bold">✓</span>
                    Carbon frame restoration
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-orange font-bold">✓</span>
                    Crack repair & frame fixing
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-brand-orange font-bold">✓</span>
                    Pickup & delivery / courier options available
                  </li>
                </ul>
                <div className="mb-4 rounded-lg border border-brand-orange/30 bg-brand-orange/5 p-4 text-left text-sm text-gray-700">
                  <p className="font-semibold mb-2">Important Tension Guidelines (After Repair)</p>
                  <p className="mb-1">⚠️ Tension limits after repair are strictly followed for player safety and racket durability.</p>
                  <p className="mb-1">• Rackets with 2 cracks: <span className="font-medium">Max 24 lbs</span></p>
                  <p className="mb-1">• Rackets with broken frame (after full repair): <span className="font-medium">Max 26 lbs</span></p>
                  <p>✅ For safer performance and longer racket life, we strongly recommend stringing at <span className="font-medium">25 lbs or below</span>.</p>
                </div>
                <Button variant="brand" className="w-full" asChild>
                  <Link href="/book?service=repair">Book Repair Service</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Before/After Gallery Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center animate-fade-in-up">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Our Work Speaks for Itself
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              See the transformation - from broken to brand new
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Before/After Slider */}
            <div className="animate-fade-in-up">
              <BeforeAfterSlider
                images={[
                  {
                    id: 1,
                    before: '/before 1.jpeg',
                    after: '/after 1.jpeg',
                    title: 'Carbon Frame Crack Repair',
                    description: 'Complete restoration of frame integrity',
                  },
                  {
                    id: 2,
                    before: '/before 2.heic',
                    after: '/after 2.heic',
                    title: 'String Replacement & Frame Polish',
                    description: 'Professional stringing with frame restoration',
                  },
                ]}
              />
            </div>

            {/* Right: Description */}
            <div className="space-y-6 animate-slide-in-right">
              <div>
                <h3 className="mb-4 text-3xl font-bold text-gray-900">
                  Expert Craftsmanship You Can Trust
                </h3>
                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                  Every repair tells a story of transformation. Our skilled technicians bring broken rackets back to life using advanced carbon fiber molding technology and precision stringing techniques.
                </p>
                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                  From invisible crack repairs to complete frame restoration, we ensure your racket performs like new. Our attention to detail and commitment to quality means you can trust us with your most valuable equipment.
                </p>
                <p className="text-lg leading-relaxed text-gray-700">
                  With over 500 successful repairs and 100% customer satisfaction, we&apos;ve built our reputation one racket at a time. See the difference professional care makes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Racquet Restoration Videos */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center animate-fade-in-up">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Racquet Restoration in Action
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Watch our technicians bring damaged rackets back to life with precision and care.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              '/videos/WhatsApp Video 2026-01-18 at 21.28.02.mp4',
              '/videos/WhatsApp Video 2026-01-18 at 21.28.04.mp4',
              '/videos/WhatsApp Video 2026-01-18 at 21.28.10.mp4',
            ].map((src, index) => (
              <div
                key={src}
                className="overflow-hidden rounded-2xl border-2 border-orange-400/30 bg-black shadow-xl transition-all duration-300 hover:border-orange-400/60 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <video
                  src={src}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center animate-fade-in-up">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              What Our Customers Say
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Real feedback from players who trusted us with their rackets
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Testimonial 1 */}
            <Card className="border-2 border-orange-200 bg-white shadow-lg transition-all duration-300 hover:border-brand-orange hover:scale-105 animate-fade-in-up">
              <CardContent className="p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 fill-brand-orange"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-gray-700 italic">
                  &quot;My racket had a major crack and I thought it was done for. Sajag Sports not only repaired it but made it feel better than new. The stringing job was perfect!&quot;
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-gray-900">Rajesh Kumar</p>
                  <p className="text-sm text-gray-600">Professional Player, Pune</p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-2 border-blue-200 bg-white shadow-lg transition-all duration-300 hover:border-brand-blue hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 fill-brand-blue"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-gray-700 italic">
                  &quot;Fast turnaround, excellent service! They repaired my frame crack and restrung my racket in just 2 days. The tension is exactly what I asked for. Highly recommended!&quot;
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-gray-900">Priya Sharma</p>
                  <p className="text-sm text-gray-600">State Level Player, Mumbai</p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-2 border-orange-200 bg-white shadow-lg transition-all duration-300 hover:border-brand-orange hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 fill-brand-red"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-gray-700 italic">
                  &quot;Best racket repair service in Pune! They saved my favorite racket that I thought was beyond repair. The team is professional, and the quality is outstanding. Worth every rupee!&quot;
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-gray-900">Amit Patel</p>
                  <p className="text-sm text-gray-600">Club Player, Pune</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center animate-fade-in-up">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Simple, fast, and reliable service process
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-orange shadow-lg brand-glow-orange animate-float">
                <Package className="h-10 w-10 text-white" />
              </div>
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="rounded-full bg-brand-orange px-3 py-1 text-sm font-bold text-white">
                  Step 1
                </span>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">Drop Off / Pickup</h3>
              <p className="text-gray-600">
                Visit our center or schedule a pickup. We offer convenient options to get your racket to us.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-blue shadow-lg brand-glow-blue animate-float" style={{ animationDelay: '0.5s' }}>
                <Settings className="h-10 w-10 text-white" />
              </div>
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="rounded-full bg-brand-blue px-3 py-1 text-sm font-bold text-white">
                  Step 2
                </span>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">Expert Service</h3>
              <p className="text-gray-600">
                Our certified stringers and technicians work on your racket with precision and care.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-red shadow-lg brand-glow-red animate-float" style={{ animationDelay: '1s' }}>
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="rounded-full bg-brand-red px-3 py-1 text-sm font-bold text-white">
                  Step 3
                </span>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">Ready to Play</h3>
              <p className="text-gray-600">
                Get notified via SMS/WhatsApp when your racket is ready for pickup or delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Store Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
          <div className="mb-8 inline-block rounded-full bg-gradient-to-r from-brand-orange to-brand-red px-6 py-2 shadow-lg animate-pulse-glow">
            <span className="font-semibold text-white">Store Coming Soon</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            India&apos;s Premium Badminton Store
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Our full range of Rackets, Shoes, and Gear will be online soon. Sign up to be notified when we launch!
          </p>
          <Card className="border-2 border-brand-orange/30 bg-white shadow-lg">
            <CardContent className="p-8">
              {submitted ? (
                <div className="flex items-center justify-center gap-2 text-brand-orange">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-semibold text-gray-900">You&apos;re on the list! We&apos;ll notify you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button type="submit" variant="brand" className="animate-pulse-glow">
                    Notify Me
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sajag Badminton Arena Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center animate-fade-in-up">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Sajag Badminton Arena
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              A dedicated high-performance space for players of all levels, designed for serious training and serious fun.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Arena Photo */}
            <div className="lg:col-span-2 animate-fade-in-up">
              <div className="overflow-hidden rounded-2xl border-2 border-brand-orange/30 shadow-xl transition-all duration-300 hover:border-brand-orange hover:scale-[1.02]">
                <img
                  src="/arena main.webp"
                  alt="Sajag Badminton Arena main view"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Side Photos + Text */}
            <div className="space-y-6 animate-slide-in-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-2xl border-2 border-brand-blue/30 shadow-md transition-all duration-300 hover:border-brand-blue hover:scale-105">
                  <img
                    src="/arena 1.jpg"
                    alt="Sajag Badminton Arena court view"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-brand-orange/30 shadow-md transition-all duration-300 hover:border-brand-orange hover:scale-105">
                  <img
                    src="/arena 2.jpg"
                    alt="Sajag Badminton Arena facilities"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-lg leading-relaxed text-gray-700">
                  Sajag Badminton Arena is our home base in Manjri, Pune — equipped with professional courts,
                  proper lighting, and a dedicated stringing & repair lab.
                </p>
                <p className="text-lg leading-relaxed text-gray-700">
                  Whether you&apos;re a beginner learning the basics or a competitive player fine-tuning your game,
                  our arena provides the right environment, coaching, and equipment support to help you level up.
                </p>
                <p className="text-lg leading-relaxed text-gray-700">
                  Visit us to experience the full Sajag ecosystem — play, train, and get your rackets serviced
                  under one roof.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-gray-200 bg-white py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div className="animate-fade-in-up">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Sajag Sports
              </h3>
              <p className="mb-2 text-sm text-gray-600">The Badminton Surgeon</p>
              <div className="mt-4 inline-block rounded-full bg-gradient-to-r from-brand-orange to-brand-red px-4 py-1 shadow-lg">
                <span className="text-xs font-semibold text-white">Store Coming Soon</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h4 className="mb-4 font-semibold text-gray-900">Contact Us</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-orange" />
                  <span>Manjri Arena, Pune</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-blue" />
                  <a href="tel:+919876543210" className="hover:text-brand-orange transition-colors">
                    +91 98765 43210
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-red" />
                  <a href="mailto:support@sajagsports.store" className="hover:text-brand-orange transition-colors">
                    support@sajagsports.store
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-brand-orange" />
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-orange transition-colors"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h4 className="mb-4 font-semibold text-gray-900">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block text-gray-600 hover:text-brand-orange transition-colors">
                  Home
                </Link>
                <Link href="/book" className="block text-gray-600 hover:text-brand-orange transition-colors">
                  Book a Service
                </Link>
                <Link href="/book" className="block text-gray-600 hover:text-brand-orange transition-colors">
                  Track Repair Status
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Sajag Sports. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
