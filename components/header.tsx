'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, LayoutDashboard, ShoppingCart, Search, Truck } from 'lucide-react'
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
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Announcement bar */}
      <div className="bg-slate-900 px-4 py-1.5 text-center text-[10px] font-medium tracking-wide text-white md:text-xs">
        <p>Soft Opening | Free shipping on eligible orders and quick racquet service across India.</p>
      </div>

      {/* Single main row: hamburger | logo | nav tabs | search | icons */}
      <div className="border-b border-slate-100 px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center gap-4">

          {/* Hamburger — mobile only */}
          <button
            className="shrink-0 p-1 text-slate-800 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt="Sajag Sports logo"
              width={36}
              height={36}
              className="h-9 w-auto object-contain"
              unoptimized
            />
            <span className="text-lg font-extrabold uppercase italic tracking-tighter text-brand-orange">
              Sajag Sports
            </span>
          </Link>

          {/* Nav tabs — desktop, right next to logo */}
          <nav className="hidden items-center gap-10 md:flex">
            <Link href="/" className="text-sm font-medium text-slate-700 hover:text-brand-orange transition-colors">
              Home
            </Link>
            <button
              onClick={scrollToServices}
              className="text-sm font-medium text-slate-700 hover:text-brand-orange transition-colors"
            >
              Services
            </button>
            <Link href="#contact" className="text-sm font-medium text-slate-700 hover:text-brand-orange transition-colors">
              Contact
            </Link>
            <Link href="/shop" className="text-sm font-medium text-slate-700 hover:text-brand-orange transition-colors">
              Store Front
            </Link>
            <Button variant="brand" size="sm" asChild className="animate-pulse-glow">
              <Link href="/book">Book a Service</Link>
            </Button>
          </nav>

          {/* Search — compact, pushes to the right */}
          <div className="relative ml-auto hidden w-48 md:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-full border-none bg-slate-100 py-1.5 pl-9 text-xs focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Search..."
              type="text"
            />
          </div>

          {/* Right icons — user/track/cart */}
          <div className="flex shrink-0 items-center gap-4 text-slate-800 md:ml-0 ml-auto">
            {user ? (
              <>
                <Link
                  href={role === 'admin' ? '/admin/dashboard' : '/profile'}
                  className="hidden sm:block"
                  aria-label="Profile"
                >
                  {role === 'admin' ? <LayoutDashboard className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="hidden sm:block text-sm font-medium text-slate-700 hover:text-brand-orange transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                className="hidden sm:block"
                onClick={openAuthModal}
                aria-label="Login"
              >
                <User className="h-5 w-5" />
              </button>
            )}
            <Link href="/track" className="hidden sm:block" aria-label="Track order">
              <Truck className="h-5 w-5" />
            </Link>
            <Link href="/cart" className="relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {mounted && itemsCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                  {itemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="mt-2 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-lg border-none bg-slate-100 py-1.5 pl-9 text-xs"
              placeholder="Search products and services..."
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-100 bg-white shadow-lg md:hidden">
          <nav className="flex flex-col gap-4 px-4 py-4">
            <Link
              href="/"
              className="font-medium text-gray-700 hover:text-brand-orange transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <button
              onClick={scrollToServices}
              className="text-left font-medium text-gray-700 hover:text-brand-orange transition-colors"
            >
              Services
            </button>
            <Link
              href="#contact"
              className="font-medium text-gray-700 hover:text-brand-orange transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/shop"
              className="font-medium text-gray-700 hover:text-brand-orange transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Store Front
            </Link>
            <Button variant="brand" className="mt-2 w-full animate-pulse-glow" asChild>
              <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
                Book a Service
              </Link>
            </Button>

            {user ? (
              <>
                <Link
                  href={role === 'admin' ? '/admin/dashboard' : '/profile'}
                  className="flex items-center font-medium text-gray-700 hover:text-brand-orange transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {role === 'admin' ? <LayoutDashboard className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                  {role === 'admin' ? 'Dashboard' : (user?.user_metadata?.full_name || user?.user_metadata?.name || 'Profile')}
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false) }}
                  className="flex items-center text-left font-medium text-gray-700 hover:text-brand-orange transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { openAuthModal(); setMobileMenuOpen(false) }}
                className="flex items-center text-left font-medium text-gray-700 hover:text-brand-orange transition-colors"
              >
                <User className="mr-2 h-4 w-4" />
                Login
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
