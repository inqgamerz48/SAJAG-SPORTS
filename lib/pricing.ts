/**
 * Pricing Engine for Sajag Sports Racquet Repairs
 * 
 * Tiered pricing based on racquet value:
 * - Category A (< ₹5,000): ₹500 per crack
 * - Category B (≥ ₹5,000): ₹700 per crack
 */

// Pricing constants
const CATEGORY_A_THRESHOLD = 5000
const CATEGORY_A_RATE = 500 // per crack
const CATEGORY_B_RATE = 700 // per crack

export const STRING_PRICES: Record<string, number> = {
    'Yonex BG 65': 499,
    'Yonex BG 65 Titanium': 699,
    'none': 0,
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
 * Calculate repair cost based on racquet value and number of cracks
 */
export function calculateRepairCost(
    racquetValue: number,
    numberOfCracks: number
): RepairCostBreakdown {
    // Input validation
    if (racquetValue <= 0) {
        throw new Error('Racquet value must be greater than 0')
    }

    if (numberOfCracks <= 0 || !Number.isInteger(numberOfCracks)) {
        throw new Error('Number of cracks must be a positive integer')
    }

    // Determine category and rate
    const category = racquetValue < CATEGORY_A_THRESHOLD ? 'A' : 'B'
    const repairRate = category === 'A' ? CATEGORY_A_RATE : CATEGORY_B_RATE
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
    shippingCost: number
): PricingBreakdown {
    const repairBreakdown = calculateRepairCost(racquetValue, numberOfCracks)
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
