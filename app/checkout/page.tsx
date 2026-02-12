'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    ChevronRight,
    ChevronLeft,
    Truck,
    Package,
    User,
    MapPin,
    Calculator,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info,
    ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'

// Price constants
const REPAIR_PRICES = {
    under5k: 499,
    above5k: 599
}

const STRING_PRICES = {
    bg65: 650,
    bg65ti: 700
}

type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6

function CheckoutForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [step, setStep] = useState<CheckoutStep>(1)
    const [loading, setLoading] = useState(false)
    const [shippingLoading, setShippingLoading] = useState(false)
    const serviceType = searchParams.get('service') || 'repair'

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Racquet Info
        priceCategory: searchParams.get('category') || 'under5k',
        brand: '',
        model: '',
        numCracks: '1',
        stringType: 'bg65',
        tension: '24',
        damageDescription: '',

        // Step 2: Customer Info
        fullName: '',
        phone: '',
        email: '',
        altPhone: '',

        // Step 3/4: Addresses
        pickupAddress: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: ''
        },
        isSameAddress: true,
        deliveryAddress: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: ''
        }
    })

    // Calculation State
    const [shippingInfo, setShippingInfo] = useState<{
        forward: { cost: number; days: string }
        return: { cost: number; days: string }
        total: number
    } | null>(null)

    // Derived Values
    const repairRate = serviceType === 'repair' ? REPAIR_PRICES[formData.priceCategory as keyof typeof REPAIR_PRICES] : 0
    const repairCost = repairRate * (serviceType === 'repair' ? parseInt(formData.numCracks) : 0)
    const stringCost = STRING_PRICES[formData.stringType as keyof typeof STRING_PRICES]
    const serviceSubtotal = repairCost + stringCost
    const totalShipping = shippingInfo?.total || 0
    const subtotalBeforeGst = serviceSubtotal + totalShipping
    const gstAmount = Math.round(subtotalBeforeGst * 0.18)
    const grandTotal = subtotalBeforeGst + gstAmount

    // Handlers
    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAddressChange = (type: 'pickup' | 'delivery', field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [`${type}Address`]: { ...prev[`${type}Address` as keyof typeof prev] as any, [field]: value }
        }))
    }

    const validateStep = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                if (!formData.brand || !formData.model) {
                    toast.error('Please enter racquet brand and model')
                    return false
                }
                return true
            case 2:
                if (!formData.fullName || formData.phone.length < 10) {
                    toast.error('Please enter valid name and phone number')
                    return false
                }
                return true
            case 3:
                if (!formData.pickupAddress.line1 || !formData.pickupAddress.city || formData.pickupAddress.pincode.length !== 6) {
                    toast.error('Please complete pickup address with valid pincode')
                    return false
                }
                return true
            case 4:
                if (!formData.isSameAddress) {
                    if (!formData.deliveryAddress.line1 || !formData.deliveryAddress.city || formData.deliveryAddress.pincode.length !== 6) {
                        toast.error('Please complete delivery address with valid pincode')
                        return false
                    }
                }
                return true
            default:
                return true
        }
    }

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => (prev + 1) as CheckoutStep)
            window.scrollTo(0, 0)
        }
    }

    const prevStep = () => {
        setStep(prev => (prev - 1) as CheckoutStep)
        window.scrollTo(0, 0)
    }

    const calculateShipping = async () => {
        setShippingLoading(true)
        try {
            const response = await fetch('/api/calculate-shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pincode: formData.pickupAddress.pincode })
            })
            const data = await response.json()
            if (data.success) {
                setShippingInfo({
                    forward: data.forward,
                    return: data.return,
                    total: data.total
                })
                setStep(6)
            } else {
                toast.error(data.error || 'Failed to calculate shipping')
            }
        } catch (error) {
            toast.error('Error connecting to shipping service')
        } finally {
            setShippingLoading(false)
        }
    }

    const handlePayment = async () => {
        if (loading) return
        setLoading(true)

        try {
            const paymentData = {
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                serviceType: 'repair',
                racquetName: `${formData.brand} ${formData.model}`,
                racketValue: formData.priceCategory === 'under5k' ? 4000 : 7000,
                address: `${formData.pickupAddress.line1}, ${formData.pickupAddress.city}, ${formData.pickupAddress.state} - ${formData.pickupAddress.pincode}`,
                stringType: formData.stringType,
                tension: formData.tension,
                existingOrderId: null
            }

            const costBreakdown = {
                total: grandTotal
            }

            const response = await fetch('/api/payu/create-hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentData, costBreakdown })
            })

            const data = await response.json()

            if (data.success) {
                // Create a dynamic form to submit to PayU
                const form = document.createElement('form')
                form.method = 'POST'
                form.action = process.env.NEXT_PUBLIC_PAYU_ENV === 'prod'
                    ? 'https://secure.payu.in/_payment'
                    : 'https://test.payu.in/_payment'

                const fields = {
                    key: data.merchantKey,
                    txnid: data.txnid,
                    amount: data.amount,
                    productinfo: data.productinfo,
                    firstname: data.firstname,
                    email: data.email,
                    phone: formData.phone,
                    hash: data.hash,
                    surl: data.surl,
                    furl: data.furl,
                    udf1: data.udf1,
                }

                Object.entries(fields).forEach(([key, value]) => {
                    const input = document.createElement('input')
                    input.type = 'hidden'
                    input.name = key
                    input.value = String(value)
                    form.appendChild(input)
                })

                document.body.appendChild(form)
                form.submit()
            } else {
                toast.error(data.error || 'Failed to initiate payment')
            }
        } catch (error) {
            toast.error('Payment initialization failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="mx-auto max-w-4xl">
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-brand-blue">Complete Your Booking</h1>
                        <span className="text-sm font-medium text-slate-500">Step {step} of 6</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-orange transition-all duration-300"
                            style={{ width: `${(step / 6) * 100}%` }}
                        />
                    </div>
                    <div className="grid grid-cols-6 mt-2 text-[10px] md:text-xs font-medium text-slate-400">
                        <div className={step >= 1 ? "text-brand-orange" : ""}>RACQUET</div>
                        <div className={step >= 2 ? "text-brand-orange" : ""}>DETAILS</div>
                        <div className={step >= 3 ? "text-brand-orange" : ""}>PICKUP</div>
                        <div className={step >= 4 ? "text-brand-orange" : ""}>DELIVERY</div>
                        <div className={step >= 5 ? "text-brand-orange" : ""}>SHIPPING</div>
                        <div className={step >= 6 ? "text-brand-orange" : ""}>SUMMARY</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Step 1: Racquet Information */}
                        {step === 1 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-brand-blue">
                                        <Package className="h-5 w-5" />
                                        <CardTitle>Racquet Information</CardTitle>
                                    </div>
                                    <CardDescription>Tell us about the racquet needing repair.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label>Racquet Price Category*</Label>
                                        <RadioGroup
                                            value={formData.priceCategory}
                                            onValueChange={(v) => handleInputChange('priceCategory', v)}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <Label
                                                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-brand-blue ${formData.priceCategory === 'under5k' ? 'border-brand-blue bg-brand-blue/5' : ''}`}
                                            >
                                                <RadioGroupItem value="under5k" className="sr-only" />
                                                <span className="text-sm font-semibold uppercase tracking-tight mb-2">Under ₹5,000</span>
                                                <span className="text-2xl font-bold">₹500 <span className="text-xs font-normal">/ crack</span></span>
                                            </Label>
                                            <Label
                                                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-brand-orange ${formData.priceCategory === 'above5k' ? 'border-brand-orange bg-brand-orange/5' : ''}`}
                                            >
                                                <RadioGroupItem value="above5k" className="sr-only" />
                                                <span className="text-sm font-semibold uppercase tracking-tight mb-2">Above ₹5,000</span>
                                                <span className="text-2xl font-bold">₹700 <span className="text-xs font-normal">/ crack</span></span>
                                            </Label>
                                        </RadioGroup>
                                        <p className="text-[10px] text-slate-400 flex items-start gap-1">
                                            <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                            Check your original purchase price to select correct category. Premium racquets require advanced treatment.
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="brand">Racquet Brand*</Label>
                                            <Select value={formData.brand} onValueChange={(v: string) => handleInputChange('brand', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Brand" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Yonex', 'Li-Ning', 'Victor', 'Apacs', 'Carlton', 'Mizuno', 'Others'].map(b => (
                                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="model">Racquet Model*</Label>
                                            <Input
                                                id="model"
                                                placeholder="e.g. Astrox 88D, Z-Force II"
                                                value={formData.model}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('model', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cracks">Number of Cracks*</Label>
                                            <Select value={formData.numCracks} onValueChange={(v: string) => handleInputChange('numCracks', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5, '6+'].map(n => (
                                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tension">Preferred Tension (lbs)*</Label>
                                            <Select value={formData.tension} onValueChange={(v: string) => handleInputChange('tension', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['22', '23', '24', '25', '26'].map(t => (
                                                        <SelectItem key={t} value={t}>{t} lbs</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Select Stringing*</Label>
                                        <RadioGroup
                                            value={formData.stringType}
                                            onValueChange={(v) => handleInputChange('stringType', v)}
                                            className="space-y-3"
                                        >
                                            <Label className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${formData.stringType === 'bg65' ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem value="bg65" />
                                                    <div>
                                                        <p className="font-bold">Yonex BG65</p>
                                                        <p className="text-xs text-slate-500">Standard performance, balanced durability</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold">₹650</span>
                                            </Label>
                                            <Label className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${formData.stringType === 'bg65ti' ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <RadioGroupItem value="bg65ti" />
                                                    <div>
                                                        <p className="font-bold">Yonex BG65 Titanium</p>
                                                        <p className="text-xs text-slate-500">Premium coated, enhanced durability & repulsion</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold">₹700</span>
                                            </Label>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="desc">Damage Description (Optional)</Label>
                                        <Textarea
                                            id="desc"
                                            placeholder="Describe the crack location or any other issues..."
                                            className="h-24 resize-none"
                                            value={formData.damageDescription}
                                            onChange={(e) => handleInputChange('damageDescription', e.target.value)}
                                        />
                                    </div>

                                    <Button onClick={nextStep} className="w-full bg-brand-blue h-12 text-lg">
                                        NEXT: CUSTOMER DETAILS <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Customer Details */}
                        {step === 2 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-brand-blue">
                                        <User className="h-5 w-5" />
                                        <CardTitle>Customer Details</CardTitle>
                                    </div>
                                    <CardDescription>We&apos;ll use this to keep you updated on your order.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name*</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Rahul Sharma"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number*</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="10-digit mobile number"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="altPhone">Alternate Contact (Optional)</Label>
                                        <Input
                                            id="altPhone"
                                            placeholder="Secondary phone number"
                                            value={formData.altPhone}
                                            onChange={(e) => handleInputChange('altPhone', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
                                            <ChevronLeft className="mr-2 h-5 w-5" /> BACK
                                        </Button>
                                        <Button onClick={nextStep} className="flex-[2] bg-brand-blue h-12">
                                            NEXT: PICKUP ADDRESS <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Pickup Details */}
                        {step === 3 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-brand-blue">
                                        <MapPin className="h-5 w-5" />
                                        <CardTitle>Pickup Details</CardTitle>
                                    </div>
                                    <CardDescription>Where should we pickup your racquet?</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Address Line 1*</Label>
                                        <Input
                                            placeholder="Building/House No., Street Name"
                                            value={formData.pickupAddress.line1}
                                            onChange={(e) => handleAddressChange('pickup', 'line1', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Address Line 2 (Optional)</Label>
                                        <Input
                                            placeholder="Landmark, Area"
                                            value={formData.pickupAddress.line2}
                                            onChange={(e) => handleAddressChange('pickup', 'line2', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>City*</Label>
                                            <Input
                                                value={formData.pickupAddress.city}
                                                onChange={(e) => handleAddressChange('pickup', 'city', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pincode*</Label>
                                            <Input
                                                placeholder="6-digit pincode"
                                                value={formData.pickupAddress.pincode}
                                                onChange={(e) => handleAddressChange('pickup', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State*</Label>
                                        <Select
                                            value={formData.pickupAddress.state}
                                            onValueChange={(v) => handleAddressChange('pickup', 'state', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'].map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
                                            <ChevronLeft className="mr-2 h-5 w-5" /> BACK
                                        </Button>
                                        <Button onClick={nextStep} className="flex-[2] bg-brand-blue h-12">
                                            NEXT: DELIVERY DETAILS <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 4: Delivery Details */}
                        {step === 4 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-brand-blue">
                                        <Truck className="h-5 w-5" />
                                        <CardTitle>Delivery Details</CardTitle>
                                    </div>
                                    <CardDescription>Where should we return your repaired racquet?</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg">
                                        <Checkbox
                                            id="same"
                                            checked={formData.isSameAddress}
                                            onCheckedChange={(checked) => handleInputChange('isSameAddress', !!checked)}
                                        />
                                        <Label htmlFor="same" className="cursor-pointer font-medium">Same as Pickup Address</Label>
                                    </div>

                                    {!formData.isSameAddress && (
                                        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <Label>Delivery Address Line 1*</Label>
                                                <Input
                                                    placeholder="Building/House No., Street Name"
                                                    value={formData.deliveryAddress.line1}
                                                    onChange={(e) => handleAddressChange('delivery', 'line1', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>City*</Label>
                                                    <Input
                                                        value={formData.deliveryAddress.city}
                                                        onChange={(e) => handleAddressChange('delivery', 'city', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Pincode*</Label>
                                                    <Input
                                                        placeholder="6-digit pincode"
                                                        value={formData.deliveryAddress.pincode}
                                                        onChange={(e) => handleAddressChange('delivery', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
                                            <ChevronLeft className="mr-2 h-5 w-5" /> BACK
                                        </Button>
                                        <Button onClick={nextStep} className="flex-[2] bg-brand-blue h-12">
                                            NEXT: CALCULATE SHIPPING <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 5: Shipping Calculation */}
                        {step === 5 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-brand-blue">
                                        <Calculator className="h-5 w-5" />
                                        <CardTitle>Shipping Calculation</CardTitle>
                                    </div>
                                    <CardDescription>Calculate the round-trip shipping cost for your location.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8 py-10">
                                    <div className="text-center space-y-4">
                                        <div className="inline-flex items-center justify-center p-4 bg-brand-blue/5 rounded-full text-brand-blue">
                                            <Truck className="h-10 w-10 animate-bounce" />
                                        </div>
                                        <h3 className="text-xl font-bold">Ready to Calculate?</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto">
                                            We&apos;ll fetch live rates from our courier partners (Delhivery, BlueDart, etc.) for both pickup and delivery.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <Button
                                            onClick={calculateShipping}
                                            disabled={shippingLoading}
                                            className="h-14 text-lg bg-brand-orange hover:bg-brand-orange/90"
                                        >
                                            {shippingLoading ? (
                                                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> FETCHING BEST RATES...</>
                                            ) : (
                                                'CALCULATE SHIPPING COST'
                                            )}
                                        </Button>
                                        <Button variant="ghost" onClick={prevStep} disabled={shippingLoading}>
                                            <ChevronLeft className="mr-2 h-4 w-4" /> REVISE ADDRESS
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 6: Order Summary */}
                        {step === 6 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-brand-blue">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <CardTitle>Review Your Order</CardTitle>
                                    </div>
                                    <CardDescription>Please check all details before proceeding to payment.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Details</h4>
                                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                                <span className="text-slate-500">Racquet:</span>
                                                <span className="font-medium text-right">{formData.brand} {formData.model}</span>
                                                <span className="text-slate-500">Category:</span>
                                                <span className="font-medium text-right">{formData.priceCategory === 'under5k' ? 'Under ₹5,000' : 'Above ₹5,000'}</span>
                                                <span className="text-slate-500">Cracks:</span>
                                                <span className="font-medium text-right">{formData.numCracks}</span>
                                                <span className="text-slate-500">String:</span>
                                                <span className="font-medium text-right">{formData.stringType === 'bg65' ? 'BG65' : 'BG65 Titanium'}</span>
                                                <span className="text-slate-500">Tension:</span>
                                                <span className="font-medium text-right">{formData.tension} lbs</span>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cost Breakdown</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-bold text-slate-900 capitalize">{serviceType}</p>
                                                        <p className="text-sm text-slate-500">{formData.brand} {formData.model}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 border-t pt-4">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Service: {serviceType === 'repair' ? 'Crack Repair' : 'Restringing'}</span>
                                                        <span className="font-medium">₹{serviceSubtotal}</span>
                                                    </div>
                                                    {serviceType === 'repair' && (
                                                        <div className="text-[11px] text-slate-400 pl-4 border-l-2 ml-1">
                                                            {formData.numCracks} crack(s) @ ₹{repairRate}/crack
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Shipping (Pickup & Return)</span>
                                                        <span className="font-medium">₹{totalShipping}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 border-t pt-4">
                                                    <div className="flex justify-between text-sm font-medium">
                                                        <span>Subtotal</span>
                                                        <span>₹{subtotalBeforeGst}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-slate-500">
                                                        <span>GST (18%)</span>
                                                        <span>₹{gstAmount}</span>
                                                    </div>
                                                    <div className="flex justify-between text-lg font-black text-brand-blue pt-2 border-t border-dashed">
                                                        <span>Grand Total</span>
                                                        <span>₹{grandTotal}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-brand-blue text-white p-4 rounded-lg flex justify-between items-center mt-4">
                                            <span className="text-lg font-bold">GRAND TOTAL</span>
                                            <span className="text-2xl font-black">₹{grandTotal}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start space-x-2">
                                            <Checkbox id="terms" required />
                                            <Label htmlFor="terms" className="text-xs text-slate-500 leading-normal">
                                                I agree to the repair <span className="underline cursor-pointer">Terms & Conditions</span>. I understand that post-repair tension is limited to 26 lbs for safety.
                                            </Label>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <Checkbox id="authorize" required />
                                            <Label htmlFor="authorize" className="text-xs text-slate-500 leading-normal">
                                                I authorize Sajag Sports to arrange pickup from my provided address.
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={() => setStep(5)} disabled={loading} className="flex-1 h-12">
                                            <ChevronLeft className="mr-2 h-5 w-5" /> RE-CALCULATE
                                        </Button>
                                        <Button
                                            onClick={handlePayment}
                                            disabled={loading}
                                            className="flex-[2] bg-brand-orange hover:bg-brand-orange/90 h-12 text-lg font-bold"
                                        >
                                            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> SECURING TRANSACTION...</> : 'PROCEED TO PAYMENT'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* Sidebar / Mini Summary */}
                    <div className="hidden lg:block space-y-6">
                        <Card className="border-none shadow-lg sticky top-24">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Order Highlights</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-400">Restoration</p>
                                        <p className="text-sm font-medium">{formData.priceCategory === 'under5k' ? 'Budget' : 'Premium'} Treatment</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-400">Logistics</p>
                                        <p className="text-sm font-medium">Pan-India Support</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                        <ShieldAlert className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-400">Safety</p>
                                        <p className="text-sm font-medium">Carbon Reinforcement</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="pt-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Estimated Timeline</p>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span>Pickup & Transit</span>
                                        <span>4-6 days</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span>Repair & Stringing</span>
                                        <span>2-3 days</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-4">
                                        <span>Return Delivery</span>
                                        <span>3-4 days</span>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-dashed border-slate-200 text-center">
                                        <span className="text-xs font-bold text-brand-blue uppercase">Total: 8-11 business days</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/10 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-brand-blue leading-relaxed">
                                Need help? WhatsApp our experts at <span className="font-bold">+91 94200 00000</span> for instant support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-brand-orange" /></div>}>
            <CheckoutForm />
        </Suspense>
    )
}
