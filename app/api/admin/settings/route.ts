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

    const priceA = dbSettings.find(s => s.key === 'repair_price_below')?.value || String(DEFAULT_REPAIR_PRICE_BELOW)
    const priceB = dbSettings.find(s => s.key === 'repair_price_above')?.value || String(DEFAULT_REPAIR_PRICE_ABOVE)
    const threshold = dbSettings.find(s => s.key === 'repair_threshold')?.value || String(DEFAULT_REPAIR_THRESHOLD)

    return NextResponse.json({
      success: true,
      priceA: parseFloat(priceA),
      priceB: parseFloat(priceB),
      threshold: parseFloat(threshold),
    })
  } catch (error: any) {
    console.warn('Fetch Settings Error (falling back to dynamic defaults):', error)
    // Return hardcoded default configurations to prevent frontend failure
    return NextResponse.json({
      success: true,
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
              in: ['repair_price_below', 'repair_price_above', 'repair_threshold']
            }
          }
        })
      } catch (dbErr) {
        console.warn('Could not delete setting keys, database may be uninitialized:', dbErr)
      }
      return NextResponse.json({
        success: true,
        priceA: DEFAULT_REPAIR_PRICE_BELOW,
        priceB: DEFAULT_REPAIR_PRICE_ABOVE,
        threshold: DEFAULT_REPAIR_THRESHOLD,
      })
    }

    const { priceA, priceB, threshold } = body

    if (priceA === undefined || priceB === undefined || threshold === undefined) {
      return NextResponse.json({ success: false, error: 'priceA, priceB, and threshold are required' }, { status: 400 })
    }

    const numPriceA = Number(priceA)
    const numPriceB = Number(priceB)
    const numThreshold = Number(threshold)

    // Enforce positive numbers only
    if (isNaN(numPriceA) || numPriceA <= 0 || isNaN(numPriceB) || numPriceB <= 0 || isNaN(numThreshold) || numThreshold <= 0) {
      return NextResponse.json({ success: false, error: 'All pricing inputs must be positive numbers only' }, { status: 400 })
    }

    const settingsData = [
      { key: 'repair_price_below', value: String(numPriceA) },
      { key: 'repair_price_above', value: String(numPriceB) },
      { key: 'repair_threshold', value: String(numThreshold) },
    ]

    for (const item of settingsData) {
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      })
    }

    return NextResponse.json({
      success: true,
      priceA: numPriceA,
      priceB: numPriceB,
      threshold: numThreshold,
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

