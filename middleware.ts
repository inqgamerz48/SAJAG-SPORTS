import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const rateLimitMap = new Map<string, number[]>()

function applyRateLimit(ip: string) {
  const windowMs = 60 * 1000 // 1 minute
  const limit = 50 
  const now = Date.now()
  const windowStart = now - windowMs

  const requestTimestamps = (rateLimitMap.get(ip) || []).filter(t => t > windowStart)
  
  if (requestTimestamps.length >= limit) {
    return false // Rate limited
  }

  requestTimestamps.push(now)
  rateLimitMap.set(ip, requestTimestamps)
  return true
}

export async function middleware(request: NextRequest) {
  // 1. RATE LIMITING
  // Get IP (works for Vercel, Cloudflare, or local)
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  
  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const isAllowed = applyRateLimit(ip)
    if (!isAllowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 2. SUPABASE ROUTE PROTECTION
  // Check if Supabase environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Route Protection Logic
  const path = request.nextUrl.pathname

  // 1. Admin Routes Protection
  // NextAuth handles admin authentication, BUT we might want to check if a Customer accidentally lands here.
  // Actually, wait: We moved to NextAuth for Admin. So Supabase middleware shouldn't block /admin! 
  // Let NextAuth handle /admin routes. We only protect /dashboard with Supabase.
  if (path.startsWith('/admin')) {
    // DO NOTHING: NextAuth's own session logic inside the /admin layout or pages will handle this.
    return supabaseResponse
  }

  // 2. Dashboard Routes Protection
  if (path.startsWith('/dashboard')) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/?login=true', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, videos, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|heic)$).*)',
  ],
}
