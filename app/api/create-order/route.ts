import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createRazorpayOrder } from '@/lib/razorpay'
import { getRazorpayEnv } from '@/lib/env'
import { z } from 'zod'

type CheckoutItem = {
  id?: string
  type?: 'service' | 'physical'
  serviceType?: string
  racquetBrand?: string
  racquetModel?: string
  tension?: number
  stringName?: string
  comments?: string
  repairImageUrl?: string
  color?: string
  quantity?: number
  price?: number
}

type CreateOrderPayload = {
  amount?: number
  existingOrderId?: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    pincode?: string
  }
  pickupAddress?: {
    line1?: string
    city?: string
    state?: string
    pincode?: string
  }
  items?: CheckoutItem[]
  costBreakdown?: {
    total?: number
    discount?: number
  }
}

function parseAmount(payload: CreateOrderPayload): number {
  const raw = payload.amount ?? payload.costBreakdown?.total
  const amount = typeof raw === 'string' ? Number(raw) : raw
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new Error('Valid amount is required')
  }
  return Number(amount.toFixed(2))
}

function extractAddress(payload: CreateOrderPayload) {
  const customerAddress = payload.customerInfo?.address?.trim()
  const pickup = payload.pickupAddress
  const pincode = pickup?.pincode || payload.customerInfo?.pincode || ''

  return {
    line1: pickup?.line1 || customerAddress || 'Address not provided',
    city: pickup?.city || 'Unknown',
    state: pickup?.state || 'Unknown',
    pincode,
  }
}

const checkoutItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['service', 'physical']).optional(),
  serviceType: z.string().max(100).optional(),
  racquetBrand: z.string().max(100).optional(),
  racquetModel: z.string().max(100).optional(),
  tension: z.number().min(10).max(40).optional(),
  stringName: z.string().max(100).optional(),
  comments: z.string().max(1000).optional(),
  repairImageUrl: z.string().url().max(500).optional(),
  color: z.string().max(50).optional(),
  quantity: z.number().int().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
})

const createOrderSchema = z.object({
  amount: z.number().min(0).optional(),
  existingOrderId: z.string().optional(),
  customerInfo: z.object({
    name: z.string().max(100).optional(),
    email: z.string().email().max(100).optional().or(z.literal('').optional()),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    pincode: z.string().regex(/^\d{6}$/).optional(),
  }).optional(),
  pickupAddress: z.object({
    line1: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    pincode: z.string().regex(/^\d{6}$/).optional(),
  }).optional(),
  items: z.array(checkoutItemSchema).max(50).optional(),
  costBreakdown: z.object({
    total: z.number().optional(),
    discount: z.number().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json()
    const validation = createOrderSchema.safeParse(rawPayload)
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid payload', 
        details: validation.error.flatten() 
      }, { status: 400 })
    }
    const payload = validation.data as CreateOrderPayload
    
    const amount = parseAmount(payload)
    const address = extractAddress(payload)

    if (!/^\d{6}$/.test(address.pincode)) {
      return NextResponse.json({ success: false, error: 'Valid 6-digit pincode is required' }, { status: 400 })
    }

    const customerName = payload.customerInfo?.name?.trim() || 'Customer'
    const customerEmail = payload.customerInfo?.email?.trim() || null
    const customerPhone = payload.customerInfo?.phone?.trim() || null
    const amountInPaise = Math.round(amount * 100)

    const existingOrderId = payload.existingOrderId?.trim()
    if (existingOrderId) {
      const existing = await prisma.order.findUnique({ where: { id: existingOrderId } })
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }
    }

    const isExistingOrder = Boolean(existingOrderId)

    // Calculate discount value safely with fallbacks
    let discountVal: number | null = null
    try {
      const repairItems = payload.items?.filter((item) => item.type === 'service' && item.serviceType === 'repair') || []
      const numRepairRackets = repairItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
      if (numRepairRackets === 2) discountVal = 100
      else if (numRepairRackets === 3) discountVal = 150
      else if (numRepairRackets >= 4) discountVal = 200
    } catch (e) {
      console.error('Failed to calculate discount value on order creation:', e)
    }

    let order
    if (isExistingOrder) {
      try {
        order = await prisma.order.update({
          where: { id: existingOrderId },
          data: {
            customerName,
            customerEmail,
            customerPhone,
            addressLine1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            status: 'Pending',
            paymentStatus: 'pending',
            logisticsDeposit: new Prisma.Decimal(amount),
            reversePickupBookedAt: null,
            razorpayPaymentId: null,
            razorpaySignature: null,
            discount: discountVal !== null ? new Prisma.Decimal(discountVal) : null,
          },
        })
      } catch (dbErr) {
        console.error('Failed to update order with discount field, retrying without it:', dbErr)
        order = await prisma.order.update({
          where: { id: existingOrderId },
          data: {
            customerName,
            customerEmail,
            customerPhone,
            addressLine1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            status: 'Pending',
            paymentStatus: 'pending',
            logisticsDeposit: new Prisma.Decimal(amount),
            reversePickupBookedAt: null,
            razorpayPaymentId: null,
            razorpaySignature: null,
          },
        })
      }
    } else {
      try {
        order = await prisma.order.create({
          data: {
            serviceType:
              payload.items?.find((item) => item.type === 'service')?.serviceType ||
              payload.items?.[0]?.serviceType ||
              'repair',
            customerName,
            customerEmail,
            customerPhone,
            addressLine1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            status: 'Pending',
            paymentStatus: 'pending',
            logisticsDeposit: new Prisma.Decimal(amount),
            discount: discountVal !== null ? new Prisma.Decimal(discountVal) : null,
            orderItems:
              payload.items && payload.items.length > 0
                ? {
                    create: payload.items.map((item) => ({
                      quantity: item.quantity || 1,
                      priceAtPurchase: new Prisma.Decimal(Number(item.price || 0)),
                      serviceType: item.type === 'service' ? item.serviceType || null : null,
                      racquetBrand: item.racquetBrand || null,
                      racquetModel: item.racquetModel || null,
                      tensionLbs: item.tension || null,
                      stringName: item.stringName || null,
                      comments: item.comments || null,
                      repairImageUrl: item.repairImageUrl || null,
                      color: item.color || null,
                    })),
                  }
                : undefined,
          },
        })
      } catch (dbErr) {
        console.error('Failed to create order with discount field, retrying without it:', dbErr)
        order = await prisma.order.create({
          data: {
            serviceType:
              payload.items?.find((item) => item.type === 'service')?.serviceType ||
              payload.items?.[0]?.serviceType ||
              'repair',
            customerName,
            customerEmail,
            customerPhone,
            addressLine1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            status: 'Pending',
            paymentStatus: 'pending',
            logisticsDeposit: new Prisma.Decimal(amount),
            orderItems:
              payload.items && payload.items.length > 0
                ? {
                    create: payload.items.map((item) => ({
                      quantity: item.quantity || 1,
                      priceAtPurchase: new Prisma.Decimal(Number(item.price || 0)),
                      serviceType: item.type === 'service' ? item.serviceType || null : null,
                      racquetBrand: item.racquetBrand || null,
                      racquetModel: item.racquetModel || null,
                      tensionLbs: item.tension || null,
                      stringName: item.stringName || null,
                      comments: item.comments || null,
                      repairImageUrl: item.repairImageUrl || null,
                      color: item.color || null,
                    })),
                  }
                : undefined,
          },
        })
      }
    }

    let razorpayOrder
    try {
      razorpayOrder = await createRazorpayOrder({
        amountInPaise,
        receipt: order.id.slice(0, 40),
        notes: { orderId: order.id },
      })
    } catch (error) {
      console.error('Failed to create Razorpay order during order creation process:', error)
      if (!isExistingOrder) {
        await prisma.order.delete({ where: { id: order.id } }).catch((delErr) => console.error('Failed to cleanup order after Razorpay creation error:', delErr))
      }
      throw error
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    })

    const { RAZORPAY_KEY_ID } = getRazorpayEnv()
    return NextResponse.json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      razorpayKeyId: RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create order', 
      reason: 'An unexpected internal error occurred while creating your order.' 
    }, { status: 500 })
  }
}
