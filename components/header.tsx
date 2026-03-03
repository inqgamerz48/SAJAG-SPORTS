'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, LayoutDashboard, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useCartStore } from '@/store/useCartStore'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, role, openAuthModal, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const itemsCount = getTotalItems()

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="Sajag Sports logo"
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
                unoptimized
              />
              <span className="text-xl font-semibold text-gray-900">
                Sajag Sports
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-8">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-700 hover:text-brand-orange transition-colors font-medium">
                Home
              </Link>
              <button
                onClick={scrollToServices}
                className="text-gray-700 hover:text-brand-orange transition-colors font-medium"
              >
                Services
              </button>
              <Link href="#contact" className="text-gray-700 hover:text-brand-orange transition-colors font-medium">
                Contact
              </Link>
              <Link href="/shop" className="text-gray-700 hover:text-brand-orange transition-colors font-medium">
                Store Front
              </Link>
              <Button variant="brand" size="sm" asChild className="animate-pulse-glow">
                <Link href="/book">Book a Service</Link>
              </Button>

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={role === 'admin' ? '/admin/dashboard' : '/profile'} className="flex items-center">
                      {role === 'admin' ? <LayoutDashboard className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                      {role === 'admin' ? 'Dashboard' : (user?.user_metadata?.full_name || user?.user_metadata?.name || 'Profile')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={openAuthModal}>
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </nav>

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-brand-orange transition-colors">
              <ShoppingCart className="h-6 w-6 relative z-10" />
              {mounted && itemsCount > 0 && (
                <span className="absolute top-0 right-0 z-20 bg-brand-orange text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                  {itemsCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 relative z-[100]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full z-[100] border-t border-gray-200 bg-white shadow-lg">
            <nav className="flex flex-col gap-4 px-4 py-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-brand-orange transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <button
                onClick={scrollToServices}
                className="text-left text-gray-700 hover:text-brand-orange transition-colors font-medium"
              >
                Services
              </button>
              <Link
                href="#contact"
                className="text-gray-700 hover:text-brand-orange transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/shop"
                className="text-gray-700 hover:text-brand-orange transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Store Front
              </Link>
              <Button variant="brand" className="w-full mt-2 animate-pulse-glow" asChild>
                <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
                  Book a Service
                </Link>
              </Button>

              {/* Mobile Auth Buttons */}
              {user ? (
                <>
                  <Link
                    href={role === 'admin' ? '/admin/dashboard' : '/profile'}
                    className="text-gray-700 hover:text-brand-orange transition-colors font-medium flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {role === 'admin' ? <LayoutDashboard className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                    {role === 'admin' ? 'Dashboard' : (user?.user_metadata?.full_name || user?.user_metadata?.name || 'Profile')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="text-left text-gray-700 hover:text-brand-orange transition-colors font-medium flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal()
                    setMobileMenuOpen(false)
                  }}
                  className="text-left text-gray-700 hover:text-brand-orange transition-colors font-medium flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
