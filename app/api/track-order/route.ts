import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { orderId, phone } = await request.json();

        if (!orderId || !phone) {
            return NextResponse.json(
                { success: false, error: 'Order ID and phone number are required' },
                { status: 400 }
            );
        }

        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

        // Fetch using Prisma instead of direct Supabase querying
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                orderItems: true,
                shipments: true,
            }
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        const customerPhone = order.customer?.phone || '';
        const cleanOrderPhone = customerPhone.replace(/[\s\-\(\)]/g, '');

        // Verify phone number
        if (phone !== 'PAYMENT_FLOW') {
            const orderPhoneLast10 = cleanOrderPhone.slice(-10);
            const inputPhoneLast10 = cleanPhone.slice(-10);

            if (orderPhoneLast10 !== inputPhoneLast10 && cleanOrderPhone !== "") {
                return NextResponse.json(
                    { success: false, error: 'Phone number does not match order records' },
                    { status: 403 }
                );
            }
        }

        // Find if any order item is a service
        const serviceItem = order.orderItems.find((item: any) => item.serviceType);

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                customer_name: order.customerName || order.customer?.fullName,
                customer_email: order.customerEmail || order.customer?.email,
                customer_phone: order.customerPhone || order.customer?.phone,
                address_line1: order.addressLine1,
                city: order.city,
                state: order.state,
                pincode: order.pincode,
                final_quote: order.finalQuote,
                logistics_deposit: order.logisticsDeposit,
                service_type: serviceItem?.serviceType || 'Products Only',
                status: order.status,
                created_at: order.createdAt,
                racquet_brand: serviceItem?.racquetBrand,
                racquet_model: serviceItem?.racquetModel,
                awb_code: order.shipments[0]?.awbCode,
                shiprocket_awb_code: order.shipments[0]?.awbCode, // backward-compatible response key
            },
        });
    } catch (error) {
        console.error('Track order error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to retrieve order tracking details', 
                reason: 'An unexpected internal error occurred while tracking the order.' 
            },
            { status: 500 }
        );
    }
}
