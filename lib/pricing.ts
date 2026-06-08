/**
 * Pricing Engine for Sajag Sports Racquet Repairs
 * 
 * Default Tiered pricing based on racquet value:
 * - Category A (< ₹4,000): ₹550 per crack
 * - Category B (≥ ₹4,000): ₹850 per crack
 */

// Default pricing constants
export const DEFAULT_REPAIR_THRESHOLD = 4000
export const DEFAULT_REPAIR_PRICE_BELOW = 550 // per crack
export const DEFAULT_REPAIR_PRICE_ABOVE = 850 // per crack

export const STRING_PRICES: Record<string, number> = {
    'BG 65 Titanium': 700,
    'BG 65': 630,
    'BG80 Power': 890,
    'BG66 Ultimax': 850,
    'none': 0,
}

export interface RepairSettings {
    priceBelow: number
    priceAbove: number
    threshold: number
}

export interface RepairCostBreakdown {
    repairCost: number
    repairRate: number
    numberOfCracks: number
    category: 'A' | 'B'
}

export interface StringCostBreakdown {
    stringCost: number
    stringName: string
}

export interface PricingBreakdown {
    repairCost: number
    repairRate: number
    numberOfCracks: number
    category: 'A' | 'B'
    stringCost: number
    stringName: string
    shippingCost: number
    shippingGst: number
    subtotal: number
    grandTotal: number
}

/**
 * Retrieve pricing settings from the database (server-only)
 */
export async function getRepairSettings(): Promise<RepairSettings> {
    try {
        const { prisma } = await import('@/lib/prisma')
        const settings = await prisma.setting.findMany()

        const priceBelow = settings.find(s => s.key === 'price_per_crack_below_threshold')?.value
        const priceAbove = settings.find(s => s.key === 'price_per_crack_above_threshold')?.value
        const threshold = settings.find(s => s.key === 'racquet_value_threshold')?.value

        return {
            priceBelow: priceBelow ? parseFloat(priceBelow) : DEFAULT_REPAIR_PRICE_BELOW,
            priceAbove: priceAbove ? parseFloat(priceAbove) : DEFAULT_REPAIR_PRICE_ABOVE,
            threshold: threshold ? parseFloat(threshold) : DEFAULT_REPAIR_THRESHOLD,
        }
    } catch (err) {
        // Fallback to default values if database is empty or not configured
        console.warn('Failed to fetch settings from DB, using defaults:', err)
        return {
            priceBelow: DEFAULT_REPAIR_PRICE_BELOW,
            priceAbove: DEFAULT_REPAIR_PRICE_ABOVE,
            threshold: DEFAULT_REPAIR_THRESHOLD,
        }
    }
}

/**
 * Calculate repair cost based on racquet value and number of cracks
 */
export function calculateRepairCost(
    racquetValue: number,
    numberOfCracks: number,
    settings?: RepairSettings
): RepairCostBreakdown {
    // Input validation
    if (racquetValue <= 0) {
        throw new Error('Racquet value must be greater than 0')
    }

    if (numberOfCracks <= 0 || !Number.isInteger(numberOfCracks)) {
        throw new Error('Number of cracks must be a positive integer')
    }

    // Determine category and rate
    const threshold = settings?.threshold ?? DEFAULT_REPAIR_THRESHOLD
    const rateBelow = settings?.priceBelow ?? DEFAULT_REPAIR_PRICE_BELOW
    const rateAbove = settings?.priceAbove ?? DEFAULT_REPAIR_PRICE_ABOVE

    const category = racquetValue < threshold ? 'A' : 'B'
    const repairRate = category === 'A' ? rateBelow : rateAbove
    const repairCost = repairRate * numberOfCracks

    return {
        repairCost,
        repairRate,
        numberOfCracks,
        category,
    }
}

/**
 * Calculate string cost based on selected string type
 */
export function calculateStringCost(stringType: string): StringCostBreakdown {
    const stringCost = STRING_PRICES[stringType] ?? 0

    return {
        stringCost,
        stringName: stringType === 'none' ? 'No Stringing' : stringType,
    }
}

/**
 * Calculate grand total including all costs
 */
export function calculateGrandTotal(
    repairCost: number,
    stringCost: number,
    shippingCost: number
): { subtotal: number; shippingGst: number; grandTotal: number } {
    const shippingGst = Math.round(shippingCost * 0.18) // 18% GST on shipping
    const subtotal = repairCost + stringCost + shippingCost
    const grandTotal = subtotal + shippingGst

    return {
        subtotal,
        shippingGst,
        grandTotal,
    }
}

/**
 * Calculate complete pricing breakdown
 */
export function calculatePricingBreakdown(
    racquetValue: number,
    numberOfCracks: number,
    stringType: string,
    shippingCost: number,
    settings?: RepairSettings
): PricingBreakdown {
    const repairBreakdown = calculateRepairCost(racquetValue, numberOfCracks, settings)
    const stringBreakdown = calculateStringCost(stringType)
    const totals = calculateGrandTotal(
        repairBreakdown.repairCost,
        stringBreakdown.stringCost,
        shippingCost
    )

    return {
        ...repairBreakdown,
        ...stringBreakdown,
        shippingCost,
        ...totals,
    }
}


/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Validate pricing inputs
 */
export function validatePricingInputs(data: {
    racquetValue: number
    numberOfCracks: number
    stringType: string
    pickupPincode: string
}): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.racquetValue || data.racquetValue <= 0) {
        errors.push('Racquet value must be greater than 0')
    }

    if (!data.numberOfCracks || data.numberOfCracks <= 0 || !Number.isInteger(data.numberOfCracks)) {
        errors.push('Number of cracks must be a positive integer')
    }

    if (!data.stringType) {
        errors.push('String type is required')
    }

    if (!data.pickupPincode || !/^\d{6}$/.test(data.pickupPincode)) {
        errors.push('Valid 6-digit pincode is required')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}
