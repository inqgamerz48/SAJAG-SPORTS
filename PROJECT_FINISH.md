# Sajag Sports – Project Finish Checklist

Use this as a single source of truth for what’s done, what’s left, and how to run/ship the project.

---

## What’s Done

### Core flow
- **Homepage** – Hero, services (Stringing / Repair), before–after, testimonials, process, arena, footer.
- **Booking** – Direct links to repair or stringing forms (`/book?service=repair`, `/book?service=stringing`).
- **Repair form** – Name, email, phone, address, racquet name, racket value, crack count (optional), string type (None / BG65 / BG65 TI), photo upload (client-side only; count stored).
- **Stringing form** – Name, email, phone, address, string type, tension; Pune-only messaging.
- **Payment page** – Service pricing table (repair only), order summary, cost breakdown (GST-inclusive service + shipping + GST on shipping), Razorpay checkout.
- **Success page** – Shows order ID from URL or sessionStorage; copy updated for paid flow.
- **Pricing** – GST-inclusive: Repair &lt; ₹5K = ₹499, &gt; ₹5K = ₹599; BG65 = ₹650; BG65 Titanium = ₹700. GST on shipping only.

### Backend & integrations
- **Calculate total** – `POST /api/calculate-total` for repair: service cost + round-trip shipping (Shiprocket) + GST on shipping.
- **Shiprocket** – Auth (cached token), serviceability, round-trip rate (Leg A + Leg B), reverse pickup after payment; env: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, optional pickup pincode/address/phone.
- **Razorpay** – Create order (`/api/razorpay/create-order`), verify signature, create DB order, book Shiprocket pickup (repair); env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- **Verify route** – Saves order with customer email/phone (or placeholders), then books Shiprocket Leg A; redirects to success with `order_id` in URL.
- **Admin orders API** – `GET /api/admin/orders` and `GET /api/admin/orders?id=xxx` using **service role** (bypasses RLS). Needs `SUPABASE_SERVICE_ROLE_KEY`.
- **Admin dashboard** – Fetches orders from admin API; string inventory from Supabase (no RLS); approve pickup, update status, final quote, reject/refund, generate label.

### Data & schema
- **Supabase** – `orders`, `media_evidence`, `pune_pincodes`, `racquets_db`, `string_inventory`, `store_waitlist`; triggers (pune pincode, `updated_at`); RLS on orders (own orders only). Orders inserted by verify route have `user_id` null.
- **Orders** – `customer_email` and `customer_phone` NOT NULL; verify uses form values or placeholders so DB accepts.

### UX / copy
- Footer: duplicate “Track Repair Status” link removed.
- Success page: “Payment Successful”, order ID shown, copy for repair vs stringing.
- Payment page: “All service prices are inclusive of 18% GST” banner.

---

## What You Should Do Next

### 1. Environment variables

- **Already used:**  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, optional `SHIPROCKET_PICKUP_PINCODE` / `SHIPROCKET_PICKUP_ADDRESS` / `SHIPROCKET_PICKUP_PHONE`.
- **For payments:**  
  `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- **For admin dashboard to show orders:**  
  `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API → service_role secret).  
  Without it, admin still loads but shows “Admin not configured” and no orders.
- **Optional:**  
  `RAZORPAY_WEBHOOK_SECRET` for webhook signature verification.

Ensure `.env.local` has no markdown (e.g. no \`\`\`env at the top); only `KEY=value` lines.

### 2. Supabase

- Run `supabase/schema.sql` in the SQL Editor if not already (tables, triggers, RLS, seed pincodes/racquets/inventory).
- Add `SUPABASE_SERVICE_ROLE_KEY` so `/api/admin/orders` (and thus the admin dashboard) works.

### 3. Razorpay

- Add Key ID and Key Secret; set `NEXT_PUBLIC_RAZORPAY_KEY_ID` for checkout.
- Optionally configure webhook URL for `payment.captured` and set `RAZORPAY_WEBHOOK_SECRET`; verify signature in `app/api/razorpay/webhook/route.ts`.

### 4. Testing

- **Repair:** Fill form (with email/phone), proceed to payment, check shipping calculation (pincode), then pay (test mode). Confirm success page shows order ID and order appears in admin (once service role is set).
- **Stringing:** Fill form, pay; confirm order in admin.
- **Admin:** Open `/admin/dashboard`; with service role set, orders and string inventory should load; approve pickup, update status, etc.

---

## Optional / Later

- **Photo upload** – Repair form currently keeps photos in memory only; upload to Supabase Storage and save `file_url` in `media_evidence` so admin can see crack photos.
- **Razorpay webhook** – Verify payload signature using `RAZORPAY_WEBHOOK_SECRET` and align status with your flow (e.g. `payment.captured` → update order).
- **Leg B (return shipment)** – After repair, create forward order in Shiprocket from lab to customer; reuse address from order.
- **Customer tracking** – Simple track-by-order-id (and maybe phone) page using Shiprocket AWB status.
- **Auth for admin** – Restrict `/admin/*` and `/api/admin/*` to logged-in admin (e.g. Supabase auth + role or env-based secret).
- **Stringing pricing** – If you add multiple stringing tiers, mirror the repair pricing table on payment page for stringing and update `calculateTotal`/stringing flow accordingly.

---

## Quick reference

| Area           | Status | Notes |
|----------------|--------|--------|
| Homepage       | Done   | No pricing table; you can add a sliding pricing banner separately. |
| Repair form    | Done   | Email, phone, pricing fields; photos not uploaded to server. |
| Stringing form | Done   | Email, phone; Pune messaging. |
| Payment        | Done   | Pricing table (repair), Razorpay, GST-inclusive messaging. |
| Success        | Done   | Order ID in URL + sessionStorage fallback. |
| Shiprocket     | Done   | Round-trip rate, reverse pickup after payment. |
| Razorpay       | Done   | Create order, verify, DB order + pickup. |
| Admin dashboard| Done   | Uses `/api/admin/orders` (service role); add key to see orders. |
| DB schema      | Done   | Run `schema.sql`; email/phone NOT NULL with placeholders if missing. |

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Book repair or stringing, complete payment (with Razorpay keys), then check `/admin/dashboard` (with `SUPABASE_SERVICE_ROLE_KEY` set).
