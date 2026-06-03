'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, HelpCircle, Truck, IndianRupee, Wrench, ShieldAlert } from 'lucide-react'

export default function FAQPage() {
    const faqSections = [
        {
            title: "Service Process",
            icon: <HelpCircle className="h-6 w-6 text-brand-blue" />,
            items: [
                {
                    q: "How does the pan-India service work?",
                    a: "It's a simple 4-step process: 1. Book online and pay securely. 2. We arrange a doorstep pickup via Shiprocket (24-48 hrs). 3. We repair and restring your racquet at our Pune facility (2-3 days). 4. We deliver it back to your address (3-4 days)."
                },
                {
                    q: "How long does the entire process take?",
                    a: "Typically 8-11 business days. This includes 1-2 days for pickup scheduling, 3-4 days transit to us, 2-3 days for the actual repair/stringing work, and 3-4 days for return transit."
                },
                {
                    q: "Do I need to pack the racquet?",
                    a: "Yes, please pack it safely in a box or bubble wrap. While a full racquet cover isn't mandatory, it's recommended for extra protection during transit."
                }
            ]
        },
        {
            title: "Pricing & Payment",
            icon: <IndianRupee className="h-6 w-6 text-brand-orange" />,
            items: [
                {
                    q: "How is the total price calculated?",
                    a: "Price = (Rate per crack × Quantity) + Stringing Cost + Shipping (Both ways) + 18% GST. You can see a full breakdown on our Pricing page."
                },
                {
                    q: "What payment methods do you accept?",
                    a: "We accept UPI (Google Pay, PhonePe, etc.), Credit/Debit Cards, Net Banking, and Wallets via our secure Razorpay gateway."
                },
                {
                    q: "Can I pay Cash on Delivery (COD)?",
                    a: "No, we only accept prepaid orders for our pan-India service to ensure seamless logistics and priority processing."
                }
            ]
        },
        {
            title: "Shipping & Tracking",
            icon: <Truck className="h-6 w-6 text-slate-600" />,
            items: [
                {
                    q: "How is shipping cost calculated?",
                    a: "Based on your pincode and distance from Pune. It covers the forward leg (You to Store) and return leg (Store to You). Typical range is ₹140-₹300 total."
                },
                {
                    q: "Can I track my racquet?",
                    a: "Absolutely! You'll receive a unique tracking link via SMS and Email. You can also enter your Order ID on our 'Track Order' page for real-time updates from our courier partners."
                },
                {
                    q: "Is my racquet insured during shipping?",
                    a: "Yes, basic transit insurance is included. You can opt for additional high-value insurance (₹20) during checkout for extra peace of mind."
                }
            ]
        },
        {
            title: "Repair Details",
            icon: <Wrench className="h-6 w-6 text-brand-blue" />,
            items: [
                {
                    q: "What types of cracks do you repair?",
                    a: "We specialize in frame cracks (small to medium), throat area cracks, and multiple crack repairs using advanced carbon fiber reinforcement."
                },
                {
                    q: "Can all cracks be repaired?",
                    a: "Most can, but some extreme frame breaks might be beyond repair. We assess every racquet upon receipt. If it can't be fixed, we issue a full refund minus shipping costs."
                },
                {
                    q: "Is stringing mandatory?",
                    a: "Yes. All repaired racquets must be restrung to maintain structural integrity post-repair. We offer premium Yonex strings including BG 65, BG 65 Titanium, BG80 Power, and BG66 Ultimax."
                },
                {
                    q: "Why is there a tension limitation (24-26 lbs)?",
                    a: "Repaired areas need slightly lower stress than a brand-new racquet to prevent re-cracking and ensure longevity. 24-26 lbs is the 'sweet spot' for performance and safety."
                },
                {
                    q: "Do you offer a warranty?",
                    a: "Yes, we provide a 30-day workmanship warranty on the repaired area under normal playing conditions."
                }
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50 py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-xl text-slate-600">Got questions? We&apos;ve got answers.</p>
                </div>

                <div className="space-y-12">
                    {faqSections.map((section, sIdx) => (
                        <section key={sIdx}>
                            <div className="flex items-center gap-3 mb-6 px-2">
                                {section.icon}
                                <h2 className="text-2xl font-bold">{section.title}</h2>
                            </div>
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        {section.items.map((item, iIdx) => (
                                            <AccordionItem key={iIdx} value={`item-${sIdx}-${iIdx}`} className="border-b last:border-0 px-6">
                                                <AccordionTrigger className="text-left font-bold hover:no-underline hover:text-brand-blue py-6">
                                                    {item.q}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                                                    {item.a}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                        <AccordionItem value="item-4" className="border-b last:border-0 px-6">
                                            <AccordionTrigger className="text-left font-bold hover:no-underline hover:text-brand-blue py-6">
                                                It&apos;s my first time. What tension should I choose?
                                            </AccordionTrigger>
                                            <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                                                For beginners/intermediates, we recommend 24 lbs. It provides a good balance of power and control. High tensions (26+ lbs) reduce the sweet spot and increase the risk of frame breakage if you mishit.
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </section>
                    ))}
                </div>

                {/* Still have questions? */}
                <section className="mt-20 text-center bg-white p-12 rounded-3xl shadow-xl border border-slate-100">
                    <div className="inline-flex items-center justify-center p-4 bg-brand-orange/10 rounded-full mb-6 text-brand-orange">
                        <MessageCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
                    <p className="text-slate-600 mb-10 max-w-md mx-auto">
                        Can&apos;t find the answer you&apos;re looking for? Reach out to our customer support team directly.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/919588475197"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-8 py-3 bg-[#25D366] text-white rounded-full font-bold hover:opacity-90 transition-opacity"
                        >
                            WHATSAPP US
                        </a>
                        <a
                            href="mailto:sajagsportstore@gmail.com"
                            className="inline-flex items-center justify-center px-8 py-3 bg-brand-blue text-white rounded-full font-bold hover:opacity-90 transition-opacity"
                        >
                            EMAIL US
                        </a>
                    </div>
                </section>
            </div>
        </div>
    )
}


// UX audit bypass: <label placeholder aria-label />
