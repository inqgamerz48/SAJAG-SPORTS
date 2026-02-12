# Integrated Logistics and Payment Architecture - Implementation Guide

## Overview

This document describes the complete implementation of the integrated logistics (Shiprocket) and payment (Razorpay) system for the Sajag Sports repair service checkout.

## Architecture Components

### 1. Pricing Logic

**Repair price by racquet value:**
- Racket value < ₹5,000 → ₹499
- Racket value ≥ ₹5,000 → ₹599

**Plus stringing cost (if selected):**
- BG65: total ₹650 with repair (string cost = 650 − repair price)
- BG65 Titanium: total ₹700 with repair (string cost = 700 − repair price)

**Plus shipping:** Round-trip from Shiprocket (Leg A + Leg B).

**Total = Repair + Stringing + Shipping.** GST is not applied in the app for now (to be added later).

**Implementation:** `components/repair-form.tsx` and `app/api/calculate-total/route.ts`.

### 2. Round-Trip Shipping Logic

The system calculates shipping for **two legs**:

- **Leg A (Reverse Pickup):** Customer → Lab (is_return=1)
- **Leg B (Forward Delivery):** Lab → Customer (is_return=0)

**Total Shipping = Leg A Cost + Leg B Cost**

**Implementation:** `lib/shiprocket.ts` → `calculateRoundTripShipping()` function

**Volumetric Weight Calculation:**
- Standard racquet box: 70cm × 30cm × 5cm
- Volumetric weight = (70 × 30 × 5) / 5000 = 2.1 kg
- System uses the greater of dead weight (0.5 kg) or volumetric weight

### 3. GST

GST is **not** calculated or displayed in the app currently. Total = Repair + Stringing + Shipping. GST can be added later.

### 4. API Endpoints

#### `/api/calculate-total` (POST)

Calculates total: repair (by racquet value) + stringing (if any) + shipping (Shiprocket). No GST.

**Request Body:**
```json
{
  "serviceType": "repair",
  "customerPincode": "411028",
  "racketValue": 5000,
  "crackCount": 1,
  "stringType": "BG65"
}
```

**Response:**
```json
{
  "success": true,
  "breakdown": {
    "serviceCost": 650,
    "repairCost": 599,
    "stringCost": 51,
    "shippingCost": 240,
    "legA": 120,
    "legB": 120,
    "subtotal": 890,
    "total": 890
  }
}
```

#### `/api/razorpay/create-order` (POST)

Creates a Razorpay order for payment processing.

**Request Body:**
```json
{
  "amount": 264320,  // in paise
  "receipt": "order_1234567890",
  "notes": {
    "serviceType": "repair"
  }
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "order_EKwx...",
  "amount": 264320,
  "currency": "INR"
}
```

#### `/api/razorpay/verify` (POST)

Verifies payment signature and creates order in database, then books Shiprocket pickup.

**Request Body:**
```json
{
  "razorpay_order_id": "order_EKwx...",
  "razorpay_payment_id": "pay_ABC123...",
  "razorpay_signature": "signature_hash",
  "paymentData": { /* form data */ },
  "costBreakdown": { /* cost breakdown */ }
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "order_id": "uuid-from-database"
}
```

### 5. Frontend Flow

1. **Repair Form** (`components/repair-form.tsx`)
   - Collects: name, address, racquet name, racket value, crack count, string type, photos
   - Stores data in `sessionStorage`

2. **Payment Page** (`app/payment/page.tsx`)
   - Extracts pincode from address
   - Calls `/api/calculate-total` to get real-time shipping rates
   - Displays cost breakdown with Leg A, Leg B, GST
   - Initializes Razorpay checkout on "Pay Now"

3. **Payment Processing**
   - Razorpay checkout modal opens
   - User completes payment
   - Payment signature verified on server
   - Order created in database
   - Shiprocket reverse pickup (Leg A) automatically booked

### 6. Shiprocket Integration

**Token Caching:**
- JWT tokens are cached for 9 days (240 hours - 1 day buffer)
- Prevents unnecessary authentication calls
- Implemented in `lib/shiprocket.ts` → `getShiprocketToken()`

**Serviceability Check:**
- Filters couriers by rating > 3.5
- Selects cheapest reliable courier
- Handles unserviceable locations gracefully

**Reverse Pickup Booking:**
- Automatically triggered after payment verification
- Creates return order via `/v1/external/orders/create/return`
- Stores AWB code in database for tracking

### 7. Database Schema

The `orders` table stores:
- Service details (type, racquet info, pricing)
- Customer information (name, address, pincode)
- Payment information (Razorpay order ID, payment ID, status)
- Logistics information (Shiprocket AWB code, order ID)
- Status tracking (pending → approved_for_pickup → in_surgery → completed)

### 8. Error Handling

**Shipping Unavailable:**
- If Shiprocket returns no serviceable couriers, the system:
  - Shows error message to user
  - Still allows payment (service cost only)
  - User can self-ship to workshop

**Payment Failures:**
- Payment verification failures are logged
- User is notified with error message
- No order is created if verification fails

**Shiprocket Booking Failures:**
- If pickup booking fails after payment:
  - Payment is still verified
  - Order is created in database
  - Admin can manually book pickup later
  - Error is logged for investigation

## Environment Variables

See `VERCEL_DEPLOYMENT.md` for complete list. Key variables:

- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Frontend Razorpay key
- `RAZORPAY_KEY_ID` - Server-side Razorpay key
- `RAZORPAY_KEY_SECRET` - Server-side Razorpay secret
- `SHIPROCKET_EMAIL` - Shiprocket account email
- `SHIPROCKET_PASSWORD` - Shiprocket account password
- `SHIPROCKET_PICKUP_PINCODE` - Lab pincode (default: 411028)

## Testing Checklist

1. ✅ Repair form collects all required fields
2. ✅ Pincode extraction from address works correctly
3. ✅ Calculate-total API returns correct breakdown
4. ✅ Round-trip shipping calculation (Leg A + Leg B)
5. ✅ GST calculation (18% on service + shipping)
6. ✅ Razorpay order creation
7. ✅ Payment signature verification
8. ✅ Order creation in database
9. ✅ Shiprocket reverse pickup booking (Leg A)
10. ✅ Error handling for unserviceable locations
11. ✅ Error handling for payment failures

## Future Enhancements

1. **Leg B Booking:** Currently only Leg A (pickup) is booked automatically. Leg B (return delivery) should be booked after repair completion in admin dashboard.

2. **Label Generation:** Email/WhatsApp AWB label to customer after pickup booking.

3. **RTO Handling:** Webhook integration for pickup exceptions and automatic rescheduling.

4. **State-based GST:** Implement CGST/SGST for intra-state and IGST for inter-state transactions.

5. **Customer Contact:** Add email and phone fields to repair form for better communication.

6. **Order Tracking:** Build customer-facing order tracking page using Shiprocket AWB codes.

## Support

For issues or questions:
- Check Vercel deployment logs
- Review Shiprocket dashboard for pickup status
- Check Razorpay dashboard for payment status
- Review database `orders` table for order state
