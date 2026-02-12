# Vercel Deployment Guide

## Environment Variables Setup

To deploy successfully to Vercel, you need to add the following environment variables in your Vercel project settings:

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://your-project.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in Supabase Dashboard > Settings > API

### Optional Environment Variables (for payment integration)

3. **NEXT_PUBLIC_RAZORPAY_KEY_ID**
   - Your Razorpay Public Key ID (starts with `rzp_`)
   - Required for Razorpay checkout on the frontend
   - Found in Razorpay Dashboard > Settings > API Keys

4. **RAZORPAY_KEY_ID**
   - Your Razorpay API Key ID
   - Required for server-side payment processing

5. **RAZORPAY_KEY_SECRET**
   - Your Razorpay API Key Secret
   - Required for server-side payment processing

6. **RAZORPAY_WEBHOOK_SECRET**
   - Your Razorpay Webhook Secret
   - Required for webhook verification

### Optional Environment Variables (for logistics integration)

7. **SHIPROCKET_EMAIL**
   - Your Shiprocket account email
   - Required for Shiprocket API authentication

8. **SHIPROCKET_PASSWORD**
   - Your Shiprocket account password
   - Required for Shiprocket API authentication

9. **SHIPROCKET_PICKUP_PINCODE** (optional)
   - Your lab/workshop pincode for reverse pickup
   - Default: `411028` (Pune)
   - Used as destination for round-trip shipping calculations

10. **SHIPROCKET_PICKUP_ADDRESS** (optional)
    - Your lab/workshop address
    - Default: `Manjri Arena, Pune`
    - Used in Shiprocket order creation

11. **SHIPROCKET_PICKUP_PHONE** (optional)
    - Your lab/workshop contact phone
    - Used in Shiprocket order creation

### How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The variable value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

### Important Notes

- The middleware will gracefully handle missing Supabase environment variables
- If Supabase variables are not set, the middleware will skip authentication checks
- Make sure to add all required variables before deploying
- After adding environment variables, trigger a new deployment

### Troubleshooting

If you encounter middleware errors:

1. **Check Environment Variables**: Ensure all required variables are set in Vercel
2. **Redeploy**: After adding variables, trigger a new deployment
3. **Check Logs**: Review Vercel deployment logs for specific error messages
4. **Verify Supabase**: Ensure your Supabase project is active and accessible

### Middleware Configuration

The middleware is configured to:
- Skip execution if Supabase environment variables are missing
- Handle errors gracefully without breaking the application
- Exclude API routes and static files from processing
- Refresh user sessions automatically
