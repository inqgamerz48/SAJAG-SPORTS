import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { CartProvider } from "@/components/products/cart-context"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Sajag Sports - The Badminton Surgeon",
  description: "Professional Stringing & Carbon Repair. Premium badminton equipment services.",
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 bg-white">
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
