# Sajag Sports - The Badminton Surgeon

Premium service-first e-commerce platform for badminton equipment services.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI
- **Language:** TypeScript

## Features

### Services
1. **Professional Stringing** - Pune City only (local logistics)
2. **Carbon Repair** - Pan-India (via Shiprocket reverse pickup)

### Key Features
- High-end racquet validation (minimum ₹2,000)
- Pune pincode validation for stringing service
- Multi-step booking wizard
- Admin dashboard with Kanban board
- Shiprocket integration for reverse pickup
- Razorpay split payment logic
- Media evidence storage for repairs

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SHIPROCKET_EMAIL` - Shiprocket account email
- `SHIPROCKET_PASSWORD` - Shiprocket account password
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret

### 3. Database Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the SQL schema from `supabase/schema.sql`
4. Create a storage bucket named `media-evidence` with public access

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── admin/
│   │   └── dashboard/     # Admin dashboard
│   ├── book/              # Booking wizard
│   ├── actions/            # Server actions
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   └── ui/                 # Shadcn/UI components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── shiprocket.ts       # Shiprocket integration
│   └── razorpay.ts          # Razorpay integration
└── supabase/
    └── schema.sql          # Database schema
```

## Design System

**Theme:** "The Surgeon's Table"
- Dark mode by default
- Clinical precision aesthetic
- Neon accents (Lime Green #32ff00, Carbon Fibre Grey #2a2a2a)
- High-trust visuals

## Business Logic

1. **Service Gating:**
   - Stringing: Only available in Pune (validated via pincode)
   - Repair: Available Pan-India via Shiprocket

2. **High-End Filter:**
   - Only racquets valued above ₹2,000 are accepted
   - Auto-rejection for entry-level frames

3. **Payment Flow:**
   - Repair: Initial ₹199 logistics deposit → Final quote payment link
   - Stringing: Direct payment (to be implemented)

## Admin Dashboard

Access at `/admin/dashboard`

Features:
- Kanban board for order management
- Order detail view with media evidence
- Shiprocket label generation
- Quote management
- String inventory tracking

## License

Private - Sajag Sports
