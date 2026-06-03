# Sajag Sports 🏸⚽

Sajag Sports is a premium web application and platform for sports enthusiasts, offering equipment sales, repair/stringing services, and seamless payment & booking integrations.

Built with a modern, high-performance stack, Sajag Sports delivers a fast, secure, and user-friendly experience.

---

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database & ORM:** [Supabase (PostgreSQL)](https://supabase.com/) & [Prisma ORM](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Payments:** [Razorpay SDK](https://razorpay.com/)
- **Shipping & Logistics:** [Shiprocket SDK](https://www.shiprocket.in/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)

---

## 🛠️ Key Features

- **E-Commerce Shop:** Browse, filter, and purchase premium sports gear.
- **Repair & Stringing Services:** Book and track repair or racquet stringing services online with interactive forms.
- **Secure Payment Gateway:** Integrated with Razorpay for instant and secure checkout.
- **Logistics Integration:** Track shipment status seamlessly via Shiprocket.
- **Admin Dashboard:** Manage orders, monitor inventory levels, and process reverse pickups/returns.

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn
- Supabase PostgreSQL database instance

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/inqgamerz48/SAJAG-SPORTS.git
   cd SAJAG-SPORTS
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory and configure the following variables:
   ```env
   DATABASE_URL="your-postgresql-database-url"
   DIRECT_URL="your-direct-postgresql-url"
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key-id"
   RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
   SHIPROCKET_EMAIL="your-shiprocket-email"
   SHIPROCKET_PASSWORD="your-shiprocket-password"
   ```

4. **Database Migrations:**
   Run Prisma migrations to set up your local database schema:
   ```bash
   npx prisma db push
   ```

5. **Start Local Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Development and Scripts

- **Linting:** `npm run lint`
- **TypeScript Check:** `npx tsc --noEmit`
- **Build Production Bundle:** `npm run build`
