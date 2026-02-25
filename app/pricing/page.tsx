'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Info, CheckCircle2, IndianRupee, Truck, Calculator, Wrench } from 'lucide-react'

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-16">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Transparent Pricing</h1>
                    <p className="text-xl text-slate-600">No hidden charges. No surprises.</p>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* Repair Charges */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                        <CardHeader className="p-0 mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-full bg-brand-orange/10">
                                    <Wrench className="h-6 w-6 text-brand-orange" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Repair Pricing (Pan-India)</CardTitle>
                            </div>
                            <CardDescription className="text-base text-slate-600">Based on your racquet&apos;s original value</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-bold">Budget Rackets</p>
                                    <p className="text-sm text-slate-500">Under ₹5,000 original price</p>
                                </div>
                                <div className="text-xl font-bold text-brand-blue">₹499 / crack</div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-brand-orange/5 rounded-xl border border-brand-orange/10">
                                <div>
                                    <p className="font-bold">Premium Rackets</p>
                                    <p className="text-sm text-slate-500">Above ₹5,000 original price</p>
                                </div>
                                <div className="text-xl font-bold text-brand-orange">₹599 / crack</div>
                            </div>
                        </CardContent>
                    </div>
                </div>

                {/* Stringing Charges */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <h2 className="text-2xl font-bold">Stringing (Mandatory)</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold">BG 65</p>
                                <p className="text-sm text-slate-500">Standard durability</p>
                            </div>
                            <div className="text-xl font-bold text-brand-blue">₹630</div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold">BG 65 Titanium</p>
                                <p className="text-sm text-slate-500">Premium coated string</p>
                            </div>
                            <div className="text-xl font-bold text-brand-blue">₹700</div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold">BG66 Ultimax</p>
                                <p className="text-sm text-slate-500">High repulsion power</p>
                            </div>
                            <div className="text-xl font-bold text-brand-blue">₹850</div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold">BG80 Power</p>
                                <p className="text-sm text-slate-500">Hard feeling & power</p>
                            </div>
                            <div className="text-xl font-bold text-brand-blue">₹890</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Examples */}
            <section className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                    <Calculator className="h-7 w-7 text-brand-blue" />
                    <h2 className="text-3xl font-bold">Pricing Examples</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Example 1 */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 p-4 border-b font-bold text-sm uppercase tracking-wider text-slate-600">
                            Example 1: Budget Racket
                        </div>
                        <div className="p-6">
                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex justify-between"><span>1 Crack Repair</span><span>₹499</span></div>
                                <div className="flex justify-between border-b pb-2"><span>BG 65 String</span><span>₹630</span></div>
                                <div className="flex justify-between font-bold pt-2"><span>Service Subtotal</span><span>₹1,129</span></div>
                                <div className="flex justify-between text-slate-500 italic"><span>Forward Shipping (est)</span><span>₹80</span></div>
                                <div className="flex justify-between text-slate-500 italic border-b pb-2"><span>Return Shipping (est)</span><span>₹80</span></div>
                                <div className="flex justify-between font-bold pt-2"><span>Total Before GST</span><span>₹1,289</span></div>
                                <div className="flex justify-between"><span>GST @ 18%</span><span>₹232</span></div>
                            </div>
                            <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-lg">GRAND TOTAL</span>
                                <span className="text-2xl font-bold text-brand-blue">₹1,521</span>
                            </div>
                        </div>
                    </div>

                    {/* Example 2 */}
                    <div className="bg-brand-blue text-white rounded-xl overflow-hidden shadow-xl scale-105 relative z-10 border-2 border-brand-orange">
                        <div className="bg-brand-blue-700 p-4 border-b border-brand-blue-600 font-bold text-sm uppercase tracking-wider text-blue-200">
                            Example 2: Premium Racket
                        </div>
                        <div className="p-6">
                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex justify-between"><span>2 Cracks Repair (₹599 ea)</span><span>₹1,198</span></div>
                                <div className="flex justify-between border-b border-blue-400/30 pb-2"><span>BG65 Titanium</span><span>₹700</span></div>
                                <div className="flex justify-between font-bold pt-2"><span>Service Subtotal</span><span>₹1,898</span></div>
                                <div className="flex justify-between text-blue-200 italic"><span>Forward Shipping (est)</span><span>₹90</span></div>
                                <div className="flex justify-between text-blue-200 italic border-b border-blue-400/30 pb-2"><span>Return Shipping (est)</span><span>₹90</span></div>
                                <div className="flex justify-between font-bold pt-2 text-white"><span>Total Before GST</span><span>₹2,078</span></div>
                                <div className="flex justify-between"><span>GST @ 18%</span><span>₹374</span></div>
                            </div>
                            <div className="pt-4 border-t-2 border-dashed border-blue-400 flex justify-between items-center">
                                <span className="font-bold text-lg">GRAND TOTAL</span>
                                <span className="text-3xl font-bold text-brand-orange">₹2,452</span>
                            </div>
                        </div>
                    </div>

                    {/* Example 3 */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 p-4 border-b font-bold text-sm uppercase tracking-wider text-slate-600">
                            Example 3: Heavy Damage
                        </div>
                        <div className="p-6">
                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex justify-between"><span>3 Cracks Repair (₹700 ea)</span><span>₹2,100</span></div>
                                <div className="flex justify-between border-b pb-2"><span>BG 65 String</span><span>₹630</span></div>
                                <div className="flex justify-between font-bold pt-2"><span>Service Subtotal</span><span>₹2,730</span></div>
                                <div className="flex justify-between text-slate-500 italic"><span>Forward Shipping (est)</span><span>₹100</span></div>
                                <div className="flex justify-between text-slate-500 italic border-b pb-2"><span>Return Shipping (est)</span><span>₹100</span></div>
                                <div className="flex justify-between font-bold pt-2"><span>Total Before GST</span><span>₹2,930</span></div>
                                <div className="flex justify-between"><span>GST @ 18%</span><span>₹527</span></div>
                            </div>
                            <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-lg">GRAND TOTAL</span>
                                <span className="text-2xl font-bold text-brand-blue">₹3,457</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Shipping Table */}
            <section className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <Truck className="h-6 w-6 text-slate-600" />
                    <h2 className="text-2xl font-bold">Shipping Estimates</h2>
                </div>
                <p className="text-slate-600 text-sm mb-6">
                    Shipping cost is calculated in real-time based on your pincode&apos;s distance from our facility in <strong>Pune</strong>.
                    The total cost includes both legs: <strong>Customer to Store</strong> and <strong>Store back to Customer</strong>.
                </p>
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Region Type</TableHead>
                            <TableHead>Estimated Cost (One Way)</TableHead>
                            <TableHead>Typical Total (Both Ways)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Metropolitan Cities (Mumbai, Delhi, Bangalore)</TableCell>
                            <TableCell>₹70 - ₹100</TableCell>
                            <TableCell>₹140 - ₹200</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Tier 2 Cities</TableCell>
                            <TableCell>₹80 - ₹120</TableCell>
                            <TableCell>₹160 - ₹240</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Remote Areas / North East</TableCell>
                            <TableCell>₹100 - ₹150</TableCell>
                            <TableCell>₹200 - ₹300</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
                    <Info className="h-5 w-5 flex-shrink-0" />
                    <p>Exact shipping cost will be calculated automatically at checkout once you enter your pickup pincode.</p>
                </div>
            </section>

            {/* Summary List */}
            <div className="grid md:grid-cols-2 gap-12 mb-20 bg-white p-10 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" /> What&apos;s Included
                    </h3>
                    <ul className="space-y-4">
                        {[
                            'Professional carbon fiber crack repair',
                            'Complete restringing with performance strings',
                            'Free grip cleaning and frame inspection',
                            'Doorstep pickup and return delivery',
                            'Real-time order tracking via SMS/Email',
                            '18% GST (Fully transparent)'
                        ].map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-slate-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2.5 flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" /> Additional Options
                    </h3>
                    <ul className="space-y-4">
                        {[
                            'Shipping Insurance (Full coverage): +₹20',
                            'Premium Grip Replacement: +₹150',
                            'Frame Painting/Customization: +₹500',
                            'Bulk Order Discount (3+ Rackets): Contact us'
                        ].map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-slate-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2.5 flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-8 italic text-slate-400">&quot;Quality repairs at prices that make sense.&quot;</h2>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-brand-blue px-10">
                        <Link href="/book?service=repair">PROCEED TO BOOKING</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white">
                        <Link href="/services">VIEW REPAIR DETAILS</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
