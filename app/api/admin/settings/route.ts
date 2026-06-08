import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  DEFAULT_REPAIR_THRESHOLD, 
  DEFAULT_REPAIR_PRICE_BELOW, 
  DEFAULT_REPAIR_PRICE_ABOVE 
} from '@/lib/pricing'

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany()

    const priceBelow = dbSettings.find(s => s.key === 'price_per_crack_below_threshold')?.value || String(DEFAULT_REPAIR_PRICE_BELOW)
    const priceAbove = dbSettings.find(s => s.key === 'price_per_crack_above_threshold')?.value || String(DEFAULT_REPAIR_PRICE_ABOVE)
    const threshold = dbSettings.find(s => s.key === 'racquet_value_threshold')?.value || String(DEFAULT_REPAIR_THRESHOLD)

    return NextResponse.json({
      success: true,
      price_per_crack_below_threshold: parseFloat(priceBelow),
      price_per_crack_above_threshold: parseFloat(priceAbove),
      racquet_value_threshold: parseFloat(threshold),
      // Legacy fields for backward compatibility with existing components
      priceA: parseFloat(priceBelow),
      priceB: parseFloat(priceAbove),
      threshold: parseFloat(threshold),
    })
  } catch (error: any) {
    console.warn('Fetch Settings Error (falling back to dynamic defaults):', error)
    return NextResponse.json({
      success: true,
      price_per_crack_below_threshold: DEFAULT_REPAIR_PRICE_BELOW,
      price_per_crack_above_threshold: DEFAULT_REPAIR_PRICE_ABOVE,
      racquet_value_threshold: DEFAULT_REPAIR_THRESHOLD,
      priceA: DEFAULT_REPAIR_PRICE_BELOW,
      priceB: DEFAULT_REPAIR_PRICE_ABOVE,
      threshold: DEFAULT_REPAIR_THRESHOLD,
      warning: 'Database uninitialized or down, using defaults'
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
    }

    const body = await req.json()

    // Handle Reset Action
    if (body.reset === true) {
      try {
        await prisma.setting.deleteMany({
          where: {
            key: {
              in: [
                'price_per_crack_below_threshold',
                'price_per_crack_above_threshold',
                'racquet_value_threshold'
              ]
            }
          }
        })
      } catch (dbErr) {
        console.warn('Could not delete setting keys from database:', dbErr)
      }
      return NextResponse.json({
        success: true,
        price_per_crack_below_threshold: DEFAULT_REPAIR_PRICE_BELOW,
        price_per_crack_above_threshold: DEFAULT_REPAIR_PRICE_ABOVE,
        racquet_value_threshold: DEFAULT_REPAIR_THRESHOLD,
        // Legacy keys
        priceA: DEFAULT_REPAIR_PRICE_BELOW,
        priceB: DEFAULT_REPAIR_PRICE_ABOVE,
        threshold: DEFAULT_REPAIR_THRESHOLD,
      })
    }

    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'key and value are required' }, { status: 400 })
    }

    const numValue = Number(value)

    // Enforce positive numbers only
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json({ success: false, error: 'All pricing inputs must be positive numbers only' }, { status: 400 })
    }

    // Validate key name
    const allowedKeys = [
      'price_per_crack_below_threshold',
      'price_per_crack_above_threshold',
      'racquet_value_threshold'
    ]

    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ success: false, error: `Invalid configuration key: ${key}` }, { status: 400 })
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: String(numValue) },
      create: { key, value: String(numValue) },
    })

    return NextResponse.json({
      success: true,
      key,
      value: numValue
    })
  } catch (error: any) {
    console.error('Update Settings Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update settings', 
      reason: 'An unexpected database error occurred while updating application settings.' 
    }, { status: 500 })
  }
}
