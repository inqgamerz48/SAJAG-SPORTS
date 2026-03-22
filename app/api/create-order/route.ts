import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createRazorpayOrder } from '@/lib/razorpay'
import { getRazorpayEnv } from '@/lib/env'

type CheckoutItem = {
  id?: string
  type?: 'service' | 'physical'
  serviceType?: string
  racquetBrand?: string
  racquetModel?: string
  tension?: number
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

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CreateOrderPayload
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

    const order = isExistingOrder
      ? await prisma.order.update({
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
          },
        })
      : await prisma.order.create({
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
                      color: null,
                    })),
                  }
                : undefined,
          },
        })

    let razorpayOrder
    try {
      razorpayOrder = await createRazorpayOrder({
        amountInPaise,
        receipt: order.id.slice(0, 40),
        notes: { orderId: order.id },
      })
    } catch (error) {
      if (!isExistingOrder) {
        await prisma.order.delete({ where: { id: order.id } }).catch(() => undefined)
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
    const message = error instanceof Error ? error.message : 'Failed to create order'
    console.error('Create order error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
