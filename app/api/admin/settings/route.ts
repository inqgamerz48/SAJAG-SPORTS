import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()

    // Initialize with defaults if empty
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          repairPriceBelow4k: 500.00,
          repairPriceAbove4k: 700.00,
        },
      })
    }

    return NextResponse.json({
      success: true,
      priceA: settings.repairPriceBelow4k,
      priceB: settings.repairPriceAbove4k,
    })
  } catch (error: any) {
    console.error('Fetch Settings Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch settings', 
      reason: 'An unexpected database error occurred while retrieving application settings.' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized via NextAuth' }, { status: 401 })
    }

    const { priceA, priceB } = await req.json()

    if (priceA === undefined || priceB === undefined) {
      return NextResponse.json({ success: false, error: 'priceA and priceB are required' }, { status: 400 })
    }

    let settings = await prisma.settings.findFirst()

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          repairPriceBelow4k: Number(priceA),
          repairPriceAbove4k: Number(priceB),
        },
      })
    } else {
      settings = await prisma.settings.create({
        data: {
          repairPriceBelow4k: Number(priceA),
          repairPriceAbove4k: Number(priceB),
        },
      })
    }

    return NextResponse.json({
      success: true,
      priceA: settings.repairPriceBelow4k,
      priceB: settings.repairPriceAbove4k,
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
