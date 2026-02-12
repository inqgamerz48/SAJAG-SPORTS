'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, ChevronRight, Package, Wrench, Truck, ShieldCheck, MessageSquare } from 'lucide-react'

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden bg-brand-blue text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626225967045-9c9ae098d5a1?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Professional Racquet Crack Repair
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto mb-10">
                        Premium structural restoration with door-to-door pickup and delivery across India.
                    </p>
                    <Button asChild size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-white px-8 h-12 text-lg">
                        <Link href="/checkout">BOOK REPAIR NOW <ChevronRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                {/* Service Categories */}
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    {/* Budget Category */}
                    <Card className="border-2 border-slate-200 hover:border-brand-blue/50 transition-all overflow-hidden bg-white shadow-xl">
                        <div className="bg-slate-100 p-6 border-b">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="h-6 w-6 text-slate-600" />
                                <span className="font-semibold uppercase tracking-wider text-slate-500 text-sm">Budget Category</span>
                            </div>
                            <CardTitle className="text-3xl font-bold">Rackets Under ₹5,000</CardTitle>
                        </div>
                        <CardContent className="p-8">
                            <div className="space-y-4 mb-8">
                                {[
                                    '₹500 per crack repair',
                                    'Complete structural fix',
                                    'Professional restringing',
                                    'Choice of BG65 or BG65 Titanium',
                                    'Free pickup from your doorstep'
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span className="text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-500 mb-1">Suitable for:</p>
                                <p className="text-slate-700 italic">Yonex GR-303, Li-Ning G-Tek 58, Victor AL-2200, Entry & intermediate rackets</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="text-center">
                                    <span className="text-slate-500 text-sm">Starting from</span>
                                    <div className="text-3xl font-bold text-brand-blue">₹1,546*</div>
                                    <span className="text-xs text-slate-400">*Includes 1 crack, stringing, shipping & GST</span>
                                </div>
                                <Button asChild className="w-full bg-brand-blue hover:bg-brand-blue/90">
                                    <Link href="/checkout?category=under5k">SELECT THIS CATEGORY <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Premium Category */}
                    <Card className="border-2 border-brand-orange/30 hover:border-brand-orange/50 transition-all overflow-hidden bg-white shadow-xl relative">
                        <div className="absolute top-0 right-0 bg-brand-orange text-white px-4 py-1 text-sm font-bold uppercase tracking-tighter">
                            Popular
                        </div>
                        <div className="bg-brand-orange/5 p-6 border-b border-brand-orange/10">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="h-6 w-6 text-brand-orange" />
                                <span className="font-semibold uppercase tracking-wider text-brand-orange text-sm">Premium Category</span>
                            </div>
                            <CardTitle className="text-3xl font-bold">Rackets Above ₹5,000</CardTitle>
                        </div>
                        <CardContent className="p-8">
                            <div className="space-y-4 mb-8">
                                {[
                                    '₹700 per crack repair',
                                    'Premium carbon reinforcement',
                                    'Professional high-tension stringing',
                                    'Choice of BG65 or BG65 Titanium',
                                    'Prioritized pickup & delivery'
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-brand-orange flex-shrink-0" />
                                        <span className="text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-8 p-4 bg-brand-orange/5 rounded-lg border border-brand-orange/10">
                                <p className="text-sm font-medium text-brand-orange mb-1">Suitable for:</p>
                                <p className="text-slate-700 italic">Yonex Astrox 88D, Li-Ning Axforce 100, Victor Thruster K9900, Pro rackets</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="text-center">
                                    <span className="text-slate-500 text-sm">Starting from</span>
                                    <div className="text-3xl font-bold text-brand-blue">₹1,768*</div>
                                    <span className="text-xs text-slate-400">*Includes 1 crack, stringing, shipping & GST</span>
                                </div>
                                <Button asChild className="w-full bg-brand-orange hover:bg-brand-orange/90">
                                    <Link href="/checkout?category=above5k">SELECT THIS CATEGORY <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* How It Works */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                        <p className="text-slate-600">Our simple 4-step process to get your racquet back in action.</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <MessageSquare className="h-10 w-10 text-brand-blue" />,
                                title: "1. Book Online",
                                desc: "Select category, cracks, and stringing preference."
                            },
                            {
                                icon: <Truck className="h-10 w-10 text-brand-blue" />,
                                title: "2. We Pickup",
                                desc: "Courier partner collects racquet from your doorstep."
                            },
                            {
                                icon: <Wrench className="h-10 w-10 text-brand-blue" />,
                                title: "3. We Repair",
                                desc: "Professional restoration + restring at our facility."
                            },
                            {
                                icon: <Package className="h-10 w-10 text-brand-blue" />,
                                title: "4. We Deliver",
                                desc: "Repaired racquet delivered back to your address."
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                                <div className="inline-flex items-center justify-center mb-4 bg-slate-50 p-4 rounded-full">
                                    {step.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center p-6 bg-slate-100 rounded-lg">
                        <p className="text-slate-700 font-medium">Total Timeline: <span className="text-brand-blue">8-11 business days</span> across India</p>
                    </div>
                </section>

                {/* Important Info */}
                <section className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Expert Restoration You Can Trust</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1 bg-brand-orange/10 p-2 rounded-lg text-brand-orange">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold mb-1">Quality Assurance</h4>
                                    <p className="text-slate-600 text-sm">Every repair undergoes structural testing and frame inspection before stringing.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 bg-brand-blue/10 p-2 rounded-lg text-brand-blue">
                                    <Wrench className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold mb-1">Mandatory Stringing</h4>
                                    <p className="text-slate-600 text-sm">All repaired rackets must be restrung to ensure structural integrity and safety.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 bg-slate-200 p-2 rounded-lg text-slate-600">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold mb-1">Safe Packaging</h4>
                                    <p className="text-slate-600 text-sm">Please pack your racquet safely. You can use any box or protective covering.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <h5 className="text-red-800 font-bold mb-1 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" /> TENSION LIMITATION
                            </h5>
                            <p className="text-red-700 text-sm leading-relaxed">
                                For structural safety post-repair, we string at a maximum of <strong>24-26 lbs</strong>. This prevents excessive stress on the repaired areas and ensures longevity.
                            </p>
                        </div>
                        <p className="text-slate-600 text-sm mb-6">
                            Not sure if your racquet is repairable? Our experts assess every racquet upon receipt. If a repair is not possible, we issue a full refund minus shipping.
                        </p>
                        <Button asChild className="w-full bg-brand-blue h-12">
                            <Link href="/checkout">START BOOKING PROCESS</Link>
                        </Button>
                    </div>
                </section>

                {/* CTA */}
                <div className="text-center py-16 bg-brand-blue rounded-3xl text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Restore Your Racquet?</h2>
                    <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join 1000+ happy players who have saved their favorite racquets with Sajag Sports.</p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Button asChild size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-white px-8">
                            <Link href="/checkout">BOOK REPAIR SERVICE NOW</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-blue">
                            <a href="https://wa.me/919420000000" target="_blank" rel="noopener noreferrer">WHATSAPP QUESTIONS</a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
