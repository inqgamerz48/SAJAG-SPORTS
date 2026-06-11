# Sajag Sports: Comprehensive Codebase Summary Report

This report outlines the complete history of technical interventions, bug fixes, and feature integrations implemented in the Sajag Sports codebase.

---

## 1. Razorpay Payment & Checkout Flow Fixes

### The Problems:
* **Cart Clearing Bug:** The shopping cart state (`useCartStore`) did not clear automatically after a customer successfully paid via Razorpay, leaving items in their cart and causing user confusion.
* **Database Deadlocks / Duplicate Retries:** When a payment was retried or updated, the database order records did not reset transaction status flags properly (specifically `reversePickupBookedAt`), which blocked state updates.
* **Missing Metadata:** City, State, and Pincode details were not consistently preserved during checkout, which corrupted downstream logistics payloads.

### The Solutions:
* **Instant Cart Clearing:** Integrated `clearCart()` directly inside the Razorpay frontend success callback handler so the cart resets immediately upon verification.
* **Resilient Order Resetting:** Configured the order creation and payment verification API routes to automatically reset `reversePickupBookedAt` to `null` whenever a pending order is updated, freeing the transaction locks.
* **Metadata Preservation:** Reinforced address parsing to guarantee city and state information are correctly stored in the PostgreSQL database profile records.

---

## 2. Shiprocket Logistics Layer Automation

### The Problems:
* **Stuck Return Orders:** The previous code only called the return creation endpoint `/orders/create/return`, which registered the return order shell but never assigned a courier or scheduled a pickup. Orders sat in `"Return Pending"` indefinitely.
* **Internal ID Leak:** The system was saving the internal `shipment_id` in the database field `awbCode` instead of the actual trackable carrier waybill number.
* **Lack of Automation:** Admins had to manually click "Track Live" to fetch tracking statuses, and there was no background retry mechanism for failed API calls.

### The Solutions:
* **Sequential Logistics Pipeline:** Refactored the shipment creation process to execute three consecutive API operations:
  1. `orders/create/return` (Create return order shell in Shiprocket)
  2. `courier/assign/awb` (Request courier allocation and generate trackable AWB code)
  3. `courier/generate/pickup` (Schedule the physical courier pickup dispatch)
* **Real-time Webhook Sync:** Implemented a POST API route at `/api/webhooks/shiprocket` to receive tracking updates directly from Shiprocket and automatically transition database orders to `In_Workshop`, `Shipped`, or `Completed`.
* **Self-Healing Background Cron:** Created a GET API route at `/api/cron/shiprocket-sync` to find orders stuck in `Return_Created` or `Manifested` states (due to temporary API downtime) and automatically retry AWB assignment and pickup scheduling.

---

## 3. Shiprocket Authentication & Credentials Audit

### The Problem:
* The Shiprocket client authentication endpoint regularly crashed with JWT parsing errors (*"Wrong number of segments"* / HTTP 401 Unauthorized) due to how credentials were encoded/decoded and processed.

### The Solution:
* Switched the authentication lookup code to securely decode the credentials dynamically using Node's `Buffer.from(password, 'base64')` method, preventing encoding format corruptions and ensuring stable JWT generation.

---

## 4. UI/UX & Admin Dashboard Upgrades

### The Improvements:
* **Separate AWB Cards:** Refactored the Admin Order Feed to dynamically list separate, trackable cards for each unique AWB (displaying distinct cards for reverse and forward shipments), removing duplicate listings.
* **Manual Retry Triggers:** Placed a visible `"Retry Shiprocket Pickup"` button on the dashboard for orders in `Return_Created` or `Manual_Fulfillment_Required` states, allowing admins to manually trigger the scheduling pipeline after updating customer details.

---

## 5. Phone Number Normalization & Validation (Shiprocket API Compatibility)

### The Problem:
* Shiprocket strictly validates the `pickup_phone` to be exactly 10 digits (no `+91` or spaces).
* **The Stripping Bug:** If a valid Indian mobile number starts with `91` (e.g. `9136731151`), Shiprocket's backend parser mistakenly treats the first two digits as the country code `91`, strips it, and saves an 8-digit number (`36731151`). Subsequent AWB assignment calls fail because the stored number is invalid (less than 10 digits).

### The Solution:
* Modified [shiprocket.ts](file:///c:/Users/nandu/Desktop/Sajag/Sajag/lib/shiprocket.ts) to clean and normalize all phone numbers to **exactly 10 digits** before calling the API. 
* *Note for testing:* Because Shiprocket's backend stripping bug is hardcoded on their servers, testing logistics allocations using numbers starting with `91` (like Aarya's `9136731151`) will cause the second leg of AWB assignment to fail. Testing must be done with standard 10-digit Indian numbers starting with `9`, `8`, `7`, or `6` (e.g. `98xxxxxxxx`, `99xxxxxxxx`).

---

## 6. Key Files Modified

* **[Sajag/lib/shiprocket.ts](file:///c:/Users/nandu/Desktop/Sajag/Sajag/lib/shiprocket.ts):** Normalized phone numbers, automated AWB assignment, and pickup scheduling.
* **[Sajag/app/admin/(dashboard)/orders/page.tsx](file:///c:/Users/nandu/Desktop/Sajag/Sajag/app/admin/\(dashboard\)/orders/page.tsx):** Added manual retry capabilities and cleaned up shipment feeds.
* **[Sajag/app/api/webhooks/shiprocket/route.ts](file:///c:/Users/nandu/Desktop/Sajag/Sajag/app/api/webhooks/shiprocket/route.ts):** Set up automated status synchronizations.
* **[Sajag/app/api/cron/shiprocket-sync/route.ts](file:///c:/Users/nandu/Desktop/Sajag/Sajag/app/api/cron/shiprocket-sync/route.ts):** Implemented automated background retry scheduler.
* **[Sajag/app/api/admin/retry-reverse-pickup/route.ts](file:///c:/Users/nandu/Desktop/Sajag/Sajag/app/api/admin/retry-reverse-pickup/route.ts):** Programmed manual reverse pickup triggers.
