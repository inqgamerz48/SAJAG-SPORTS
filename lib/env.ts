import { z } from 'zod'

const razorpayEnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
})

const delhiveryEnvSchema = z.object({
  DELHIVERY_API_TOKEN: z.string().min(1),
  DELHIVERY_PICKUP_LOCATION_NAME: z.string().min(1).optional(),
  DELHIVERY_PICKUP_NAME: z.string().min(1).optional(),
  DELHIVERY_PICKUP_PHONE: z.string().min(7).optional(),
  DELHIVERY_PICKUP_ADDRESS: z.string().min(1).optional(),
  DELHIVERY_PICKUP_CITY: z.string().min(1).optional(),
  DELHIVERY_PICKUP_STATE: z.string().min(1).optional(),
  DELHIVERY_PICKUP_PINCODE: z.string().regex(/^\d{6}$/).optional(),
  // GST fields - required by Delhivery API for order creation
  DELHIVERY_SELLER_GST_TIN: z.string().optional(),
  DELHIVERY_HSN_CODE: z.string().optional(),
  // Registered client name - must match exactly (case-sensitive) with Delhivery account
  DELHIVERY_CLIENT_NAME: z.string().optional(),
})

export type RazorpayEnv = z.infer<typeof razorpayEnvSchema>
export type DelhiveryEnv = z.infer<typeof delhiveryEnvSchema>

let cachedRazorpayEnv: RazorpayEnv | null = null
let cachedDelhiveryEnv: DelhiveryEnv | null = null

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

export function getDelhiveryEnv(): DelhiveryEnv {
  if (cachedDelhiveryEnv) return cachedDelhiveryEnv

  const parsed = delhiveryEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid Delhivery environment variables: ${missing}`)
  }

  cachedDelhiveryEnv = parsed.data
  return cachedDelhiveryEnv
}
