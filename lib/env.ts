import { z } from 'zod'

const razorpayEnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
})

const shiprocketEnvSchema = z.object({
  SHIPROCKET_API_TOKEN: z.string().min(1),
  SHIPROCKET_PICKUP_LOCATION_NAME: z.string().min(1).optional(),
  SHIPROCKET_PICKUP_NAME: z.string().min(1).optional(),
  SHIPROCKET_PICKUP_PHONE: z.string().min(7).optional(),
  SHIPROCKET_PICKUP_ADDRESS: z.string().min(1).optional(),
  SHIPROCKET_PICKUP_CITY: z.string().min(1).optional(),
  SHIPROCKET_PICKUP_STATE: z.string().min(1).optional(),
  SHIPROCKET_PICKUP_PINCODE: z.string().regex(/^\d{6}$/).optional(),
  // GST fields - required by Shiprocket API for order creation
  SHIPROCKET_SELLER_GST_TIN: z.string().optional(),
  SHIPROCKET_HSN_CODE: z.string().optional(),
  // Registered client name - must match exactly (case-sensitive) with Shiprocket account
  SHIPROCKET_CLIENT_NAME: z.string().optional(),
})

export type RazorpayEnv = z.infer<typeof razorpayEnvSchema>
export type ShiprocketEnv = z.infer<typeof shiprocketEnvSchema>

let cachedRazorpayEnv: RazorpayEnv | null = null
let cachedShiprocketEnv: ShiprocketEnv | null = null

export function getRazorpayEnv(): RazorpayEnv {
  if (cachedRazorpayEnv) return cachedRazorpayEnv

  const parsed = razorpayEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid Razorpay environment variables: ${missing}`)
  }

  cachedRazorpayEnv = parsed.data
  return cachedRazorpayEnv
}

export function getShiprocketEnv(): ShiprocketEnv {
  if (cachedShiprocketEnv) return cachedShiprocketEnv

  const parsed = shiprocketEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid Shiprocket environment variables: ${missing}`)
  }

  cachedShiprocketEnv = parsed.data
  return cachedShiprocketEnv
}
