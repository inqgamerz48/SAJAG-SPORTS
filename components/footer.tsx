import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'

export function Footer() {
    return (
        <footer id="contact" className="border-t border-gray-200 bg-white py-12 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Brand */}
                    <div className="animate-fade-in-up">
                        <div className="mb-4 flex items-center gap-2">
                            <Image
                                src="/logo.jpeg"
                                alt="Sajag Sports logo"
                                width={40}
                                height={40}
                                className="h-10 w-auto object-contain"
                                unoptimized
                            />
                            <h3 className="text-xl font-bold text-gray-900">
                                Sajag Sports
                            </h3>
                        </div>
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-brand-red"
                                >
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                                <a
                                    href="https://www.instagram.com/sajagracketrevive/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-brand-orange transition-colors"
                                >
                                    Instagram
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
                            <Link href="/track" className="block text-gray-600 hover:text-brand-orange transition-colors">
                                Track Order
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
                    <p>&copy; {new Date().getFullYear()} Sajag Sports. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
