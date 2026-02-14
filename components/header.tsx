'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, role, openAuthModal, signOut } = useAuth()

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
            <Button variant="brand" size="sm" asChild className="animate-pulse-glow">
              <Link href="/book">Book a Service</Link>
            </Button>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={role === 'admin' ? '/admin/dashboard' : '/dashboard'}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
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
              <Button variant="brand" className="w-full mt-2 animate-pulse-glow" asChild>
                <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
                  Book a Service
                </Link>
              </Button>

              {/* Mobile Auth Buttons */}
              {user ? (
                <>
                  <Link
                    href={role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                    className="text-gray-700 hover:text-brand-orange transition-colors font-medium flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
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
