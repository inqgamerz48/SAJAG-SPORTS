'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HeroSlider } from '@/components/hero-slider'
import { StatsCounter } from '@/components/stats-counter'
import { createClient } from '@/lib/supabase/client'
import {
    CheckCircle2,
    Package,
    Clock,
    Settings,
    Scissors,
    Wrench,
    Grid2x2,
    Gift,
    Home,
    Box,
    User,
    MapPin, // Kept for the Stringing Service Card
} from 'lucide-react'
import { BeforeAfterSlider } from '@/components/before-after-slider'
import { ShopClient } from '@/components/shop/shop-client'

export function HomePageClient({ initialProducts, accessoriesProducts }: { initialProducts: any[], accessoriesProducts: any[] }) {
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
        <div className="min-h-screen bg-white pb-20 md:pb-0">
            {/* Scroll progress bar */}
            <div
                className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-brand-orange via-brand-blue to-brand-red transition-[width] duration-150 ease-out"
                style={{ width: `${scrollProgress}%` }}
                aria-hidden
            />

            <section className="relative">
                <HeroSlider />
            </section>

            <section className="bg-white px-4 py-8">
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4">
                    <Link href="/shop" className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                        <span className="font-black italic tracking-tighter text-slate-800">SHOP RACKETS</span>
                    </Link>
                    <Link href="/book?service=stringing" className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                        <span className="font-black italic tracking-tighter text-slate-800">STRINGING</span>
                    </Link>
                    <Link href="/book?service=repair" className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                        <span className="font-black italic tracking-tighter text-slate-800">REPAIR</span>
                    </Link>
                    <Link href="/track" className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                        <span className="font-black italic tracking-tighter text-slate-800">TRACK ORDER</span>
                    </Link>
                </div>
            </section>

            <StatsCounter />

            {/* Services Showcase Section */}
            <section className="py-20 px-4 bg-white" id="services">
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
                        <Card className="border-2 border-brand-blue/30 bg-white shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-brand-blue/50 rounded-3xl">
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
                        <Card className="border-2 border-brand-orange/30 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-brand-orange/50 rounded-3xl relative overflow-hidden">
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

            {/* Promo Banner Section */}
            <section className="py-12 px-4 bg-white">
                <div className="mx-auto max-w-7xl relative overflow-hidden rounded-3xl shadow-2xl animate-fade-in-up bg-gradient-to-br from-brand-orange to-brand-red border border-brand-orange/20">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                    <div className="relative px-6 py-12 md:py-16 text-center text-white flex flex-col items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-semibold text-sm mb-6 shadow-sm border border-white/30 backdrop-blur-md">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            Limited Time Offer
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight shadow-sm drop-shadow-md">
                            Free Shipping on Products!
                        </h2>
                        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl font-medium">
                            Use code <span className="bg-white text-brand-orange px-3 py-1 rounded-md font-bold mx-1 shadow-inner">SAJAGSPORTS</span> at checkout for free delivery on equipment orders over ₹700.
                        </p>
                        <Button variant="secondary" size="lg" className="rounded-full px-8 py-6 text-lg font-bold shadow-xl hover:-translate-y-1 transition-transform" asChild>
                            <Link href="/shop">Shop Now</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 text-center animate-fade-in-up">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                            Featured Products
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Our latest and greatest badminton gear. Check out what's new in store.
                        </p>
                    </div>

                    <ShopClient initialProducts={initialProducts} limit={4} hideHeader />

                    <div className="mt-12 text-center">
                        <Button variant="outline" size="lg" asChild className="animate-pulse-glow">
                            <Link href="/shop">View All Products</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Accessories Section */}
            <section className="py-20 px-4 bg-white">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 text-center animate-fade-in-up">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                            Shop Accessories
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Premium badminton accessories to enhance your game. Add to your repair order or buy separately.
                        </p>
                    </div>

                    <ShopClient initialProducts={accessoriesProducts} limit={4} hideHeader />

                    <div className="mt-12 text-center">
                        <Button variant="outline" size="lg" asChild className="animate-pulse-glow">
                            <Link href="/shop">View All Accessories</Link>
                        </Button>
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
                            '/videos/racquet-restoration-1.mp4',
                            '/videos/racquet-restoration-2.mp4',
                            '/videos/racquet-restoration-3.mp4',
                        ].map((src, index) => (
                            <div
                                key={src}
                                className="overflow-hidden rounded-3xl border-2 border-orange-400/30 bg-black shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-orange-400/60 hover:-translate-y-2 animate-fade-in-up"
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
                        <Card className="border-2 border-orange-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-brand-orange animate-fade-in-up rounded-3xl">
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
                        <Card className="border-2 border-blue-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-brand-blue animate-fade-in-up rounded-3xl" style={{ animationDelay: '0.2s' }}>
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
                        <Card className="border-2 border-orange-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-brand-orange animate-fade-in-up rounded-3xl" style={{ animationDelay: '0.4s' }}>
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
                    <Card className="border-2 border-brand-orange/30 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 rounded-3xl">
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
                            <div className="overflow-hidden rounded-3xl border-2 border-brand-orange/30 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-brand-orange hover:-translate-y-1">
                                <Image
                                    src="/arena main.webp"
                                    alt="Sajag Badminton Arena main view"
                                    width={1200}
                                    height={800}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Side Photos + Text */}
                        <div className="space-y-6 animate-slide-in-right">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="overflow-hidden rounded-3xl border-2 border-brand-blue/30 shadow-md transition-all duration-300 hover:shadow-xl hover:border-brand-blue hover:-translate-y-1">
                                    <Image
                                        src="/arena 1.jpg"
                                        alt="Sajag Badminton Arena court view"
                                        width={600}
                                        height={400}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="overflow-hidden rounded-3xl border-2 border-brand-orange/30 shadow-md transition-all duration-300 hover:shadow-xl hover:border-brand-orange hover:-translate-y-1">
                                    <Image
                                        src="/arena 2.jpg"
                                        alt="Sajag Badminton Arena facilities"
                                        width={600}
                                        height={400}
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

            <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-100 bg-white px-2 py-3 md:hidden">
                <Link className="flex flex-col items-center gap-1 text-brand-orange" href="/">
                    <Home className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Home</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-700" href="/shop">
                    <Grid2x2 className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Shop</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-700" href="/book">
                    <Gift className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Book</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-700" href="/profile">
                    <User className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Account</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-700" href="/track">
                    <Box className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Track</span>
                </Link>
            </div>

        </div>
    )
}
