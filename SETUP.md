# Setup Guide - Sajag Sports

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Shiprocket account (for Pan-India repair service)
- A Razorpay account (for payments)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire SQL script from `supabase/schema.sql`
3. Go to **Storage** and create a new bucket:
   - Name: `media-evidence`
   - Public: Yes (or configure RLS policies as needed)
4. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Shiprocket Configuration
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1
SHIPROCKET_PICKUP_PHONE=your_phone_number
SHIPROCKET_PICKUP_ADDRESS=Manjri Arena, Pune
SHIPROCKET_PICKUP_PINCODE=411028

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Shiprocket

1. Sign up at [shiprocket.in](https://shiprocket.in)
2. Get your API credentials from the dashboard
3. Configure your pickup address (Manjri Arena, Pune)
4. Add the credentials to `.env.local`

### 5. Set Up Razorpay

1. Sign up at [razorpay.com](https://razorpay.com)
2. Get your Key ID and Key Secret from **Settings > API Keys**
3. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
4. Add the credentials to `.env.local`

### 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Setup Details

### Tables Created

1. **racquets_db** - Whitelist of approved high-end racquets
2. **orders** - All service orders
3. **pune_pincodes** - Valid Pune pincodes for stringing service
4. **media_evidence** - Before/after images for repairs
5. **string_inventory** - String stock tracking
6. **store_waitlist** - Email list for store launch

### Important Triggers

- **Auto-rejection trigger**: Automatically rejects stringing orders if pincode is not in Pune
- **Auto-logistics mode**: Sets logistics mode based on service type

### Sample Data

The schema includes:
- 50+ Pune pincodes pre-populated
- 14+ high-end racquet models
- 6 string types with inventory

## Storage Bucket Setup

1. Go to Supabase Dashboard > Storage
2. Create bucket: `media-evidence`
3. Set to **Public** or configure RLS policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-evidence');

-- Allow public read access
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media-evidence');
```

## Testing the Application

### Test Booking Flow

1. Visit `/book`
2. Select a service (Stringing or Repair)
3. For stringing, enter a Pune pincode (e.g., 411028)
4. Select a racquet from the list
5. Complete the form
6. Submit the order

### Test Admin Dashboard

1. Visit `/admin/dashboard`
2. View orders in the Kanban board
3. Click on an order to see details
4. Test order status updates
5. Test Shiprocket label generation (for repair orders)

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

### Environment Variables for Production

Make sure to update:
- `NEXT_PUBLIC_APP_URL` to your production domain
- Razorpay webhook URL in Razorpay dashboard
- Shiprocket pickup address (if different)

## Troubleshooting

### Common Issues

1. **Supabase connection errors**: Check your URL and anon key
2. **Storage upload fails**: Verify bucket exists and RLS policies
3. **Shiprocket API errors**: Check credentials and API endpoint
4. **Razorpay payment fails**: Verify key ID and secret, check webhook URL

### Debug Mode

Enable debug logging by adding to `.env.local`:

```env
NODE_ENV=development
```

## Next Steps

- [ ] Set up email notifications (SendGrid, Resend, etc.)
- [ ] Add SMS notifications for order updates
- [ ] Implement user authentication (Supabase Auth)
- [ ] Add order tracking page for customers
- [ ] Set up analytics (Google Analytics, etc.)

## Support

For issues or questions, contact: support@sajagsports.store
