'use client' 

import { useState, useEffect } from 'react' 
import { useRouter } from 'next/navigation' 
import { Button } from '@/components/ui/button' 
import { Input } from '@/components/ui/input' 
import { Label } from '@/components/ui/label' 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card' 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' 
import { Slider } from '@/components/ui/slider' 
import { Badge } from '@/components/ui/badge' 
import { toast } from 'sonner' 
import { STRING_PRICES, formatCurrency } from '@/lib/pricing' 
import { useAuth } from '@/components/providers/auth-provider' 
import { useCartStore } from '@/store/useCartStore' 
import { Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react' 
import { Textarea } from '@/components/ui/textarea' 

interface StringingRacquetData { 
  id: string 
  brand: string 
  model: string 
  stringName: string 
  tension: number[] 
  comments: string 
} 

interface ContactInfo { 
  name: string 
  email: string 
  phone: string 
  pincode: string 
} 

const stringOptions = [ 
  'BG 65', 
  'BG 65 Titanium', 
  'BG80 Power', 
  'BG66 Ultimax', 
] 

export function StringingForm() { 
  const router = useRouter() 
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ 
    name: '', 
    email: '', 
    phone: '', 
    pincode: '', 
  }) 

  const createEmptyRacquet = (): StringingRacquetData => ({ 
    id: Math.random().toString(36).substring(7), 
    brand: '', 
    model: '', 
    stringName: '', 
    tension: [24], 
    comments: '', 
  }) 

  const [racquets, setRacquets] = useState<StringingRacquetData[]>([createEmptyRacquet()]) 
  const [loading, setLoading] = useState(false) 
  const [checkingPincode, setCheckingPincode] = useState(false) 
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle') 
  const [pincodeMessage, setPincodeMessage] = useState('') 

  const { user, openAuthModal } = useAuth() 
  const { addItem } = useCartStore() 

  // Real-time Pincode Validation (Pune City mostly) 
  useEffect(() => { 
    const pincode = contactInfo.pincode 
    if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) { 
      const checkServiceability = async () => { 
        setCheckingPincode(true) 
        setPincodeStatus('idle') 
        try { 
          const res = await fetch('/api/calculate-shipping', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ pincode }) 
          }) 
          const data = await res.json() 
          if (data.success && data.serviceable) { 
            setPincodeStatus('valid') 
            setPincodeMessage(`Service available! ${data.rates?.courier_name ? `(${data.rates.courier_name})` : ''}`) 
          } else { 
            setPincodeStatus('invalid') 
            setPincodeMessage(data.error || 'Shipping not available for this pincode') 
          } 
        } catch (error) { 
          setPincodeStatus('invalid') 
          setPincodeMessage('Error checking serviceability') 
        } finally { 
          setCheckingPincode(false) 
        } 
      } 
      const timer = setTimeout(checkServiceability, 1000) 
      return () => clearTimeout(timer) 
    } else { 
      setPincodeStatus('idle') 
      setPincodeMessage('') 
    } 
  }, [contactInfo.pincode]) 

  const handleUpdateRacquet = (id: string, updates: Partial<StringingRacquetData>) => { 
    setRacquets(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r)) 
  } 

  const handleAddRacquet = () => { 
    if (racquets.length >= 10) { 
      toast.error('You can only submit up to 10 racquets per order.') 
      return 
    } 
    setRacquets(prev => [...prev, createEmptyRacquet()]) 
  } 

  const handleRemoveRacquet = (id: string) => { 
    if (racquets.length === 1) return 
    setRacquets(prev => prev.filter(r => r.id !== id)) 
  } 

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault() 

    const pincode = contactInfo.pincode 
    if (!pincode || !/^\d{6}$/.test(pincode)) { 
      toast.error('Please enter a valid 6-digit pincode.') 
      return 
    } 

    const missingDetails = racquets.some(r => !r.brand.trim() || !r.model.trim() || !r.stringName.trim()) 
    if (missingDetails) { 
      toast.error('Please enter the brand, model, and select a string option for all racquets.') 
      return 
    } 

    setLoading(true) 

    try { 
      const checkRes = await fetch(`/api/calculate-shipping`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ pincode }) 
      }) 
      const checkData = await checkRes.json() 

      if (!checkData.success) { 
        toast.error(checkData.error || 'Shipping not available for this pincode.') 
        setLoading(false) 
        return 
      } 

      racquets.forEach((racquet) => { 
        const stringPrice = STRING_PRICES[racquet.stringName as keyof typeof STRING_PRICES] || 600 
        addItem({ 
          name: `${racquet.brand} ${racquet.model} Stringing - ${racquet.stringName}`, 
          price: stringPrice, 
          quantity: 1, 
          type: 'service', 
          serviceType: 'stringing', 
          racquetBrand: racquet.brand, 
          racquetModel: racquet.model, 
          tension: racquet.tension[0], 
          stringName: racquet.stringName, 
          customerName: contactInfo.name, 
          customerEmail: contactInfo.email, 
          customerPhone: contactInfo.phone, 
          customerPincode: contactInfo.pincode, 
          comments: racquet.comments, 
        }) 
      }) 

      router.push('/cart') 
    } catch (error) { 
      console.error('Submission error:', error) 
      toast.error('Failed to process your request. Please try again.') 
      setLoading(false) 
    } 
  } 

  return ( 
    <Card className="border-2 border-brand-blue/30 bg-white shadow-lg"> 
      <CardHeader> 
        <div className="flex items-center justify-between"> 
          <div> 
            <CardTitle className="text-2xl font-bold text-gray-900">Racquet Stringing Service</CardTitle> 
            <CardDescription className="text-gray-600"> 
              Pick-up & Delivery available across Pune City. 
            </CardDescription> 
          </div> 
          <Badge className="bg-gradient-to-r from-brand-orange to-brand-red text-white px-4 py-1"> 
            Fast Turnaround 
          </Badge> 
        </div> 
      </CardHeader> 
      <CardContent> 
        <form onSubmit={handleSubmit} className="space-y-6"> 

          <div className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-4 text-sm text-gray-700"> 
            <p className="font-semibold mb-1">24-Hour Pick-Up &amp; Delivery (Pune City)</p> 
            <p className="mb-1"> 
              We provide professional racquet stringing services in Pune with fast 24-hour pick-up and delivery. 
            </p> 
            <p> 
              Designed for players who want consistent tension, precision stringing, and zero hassle. 
            </p> 
          </div> 

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
            {/* Left Column: Personal Details */} 
            <div className="space-y-4"> 
              <h3 className="font-semibold text-gray-900">Contact Details</h3> 
              <div> 
                <Label htmlFor="stringing-name" className="text-gray-700">Full Name *</Label> 
                <Input 
                  id="stringing-name" 
                  type="text" 
                  value={contactInfo.name} 
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} 
                  required 
                  className="mt-1" 
                  placeholder="Enter your full name" 
                /> 
              </div> 
              <div> 
                <Label htmlFor="stringing-email" className="text-gray-700">Email *</Label> 
                <Input 
                  id="stringing-email" 
                  type="email" 
                  value={contactInfo.email} 
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} 
                  required 
                  className="mt-1" 
                  placeholder="your@email.com" 
                /> 
              </div> 
              <div> 
                <Label htmlFor="stringing-phone" className="text-gray-700">Phone (WhatsApp) *</Label> 
                <Input 
                  id="stringing-phone" 
                  type="tel" 
                  value={contactInfo.phone} 
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} 
                  required 
                  className="mt-1" 
                  placeholder="10-digit mobile number" 
                /> 
              </div> 
              <div> 
                <Label htmlFor="stringing-pincode" className="text-gray-700">Pickup Pincode (Pune City) *</Label> 
                <Input 
                  id="stringing-pincode" 
                  type="text" 
                  maxLength={6} 
                  value={contactInfo.pincode} 
                  onChange={(e) => setContactInfo({ ...contactInfo, pincode: e.target.value.replace(/\D/g, '') })} 
                  required 
                  className="mt-1" 
                  placeholder="e.g. 411001" 
                /> 
                <div className="mt-2 h-6 text-sm"> 
                  {checkingPincode && ( 
                    <div className="flex items-center gap-2 text-gray-500"> 
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking serviceability... 
                    </div> 
                  )} 
                  {!checkingPincode && pincodeStatus === 'valid' && ( 
                    <div className="flex items-center gap-2 text-green-600"> 
                      <CheckCircle2 className="h-4 w-4" /> {pincodeMessage} 
                    </div> 
                  )} 
                  {!checkingPincode && pincodeStatus === 'invalid' && ( 
                    <div className="flex items-center gap-2 text-red-600"> 
                      <XCircle className="h-4 w-4" /> {pincodeMessage} 
                    </div> 
                  )} 
                </div> 
              </div> 
            </div> 

            {/* Right Column: Multiple Racquets */} 
            <div className="space-y-8"> 
              {racquets.map((racquet, index) => ( 
                <div key={racquet.id} className="relative p-6 border-2 border-gray-100 rounded-xl bg-gray-50/50"> 
                  <div className="flex justify-between items-center mb-4"> 
                    <h3 className="font-bold text-lg text-brand-blue">Racquet {index + 1}</h3> 
                    {racquets.length > 1 && ( 
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveRacquet(racquet.id)} 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                      > 
                        <Trash2 className="w-4 h-4 mr-1" /> Remove 
                      </Button> 
                    )} 
                  </div> 
                  <div className="space-y-4"> 
                    <div className="grid grid-cols-2 gap-4"> 
                      <div> 
                        <Label htmlFor={`brand-${racquet.id}`} className="text-gray-700">Brand *</Label> 
                        <Input 
                          id={`brand-${racquet.id}`} 
                          value={racquet.brand} 
                          onChange={(e) => handleUpdateRacquet(racquet.id, { brand: e.target.value })} 
                          required 
                          className="mt-1 bg-white" 
                          placeholder="e.g. Yonex" 
                        /> 
                      </div> 
                      <div> 
                        <Label htmlFor={`model-${racquet.id}`} className="text-gray-700">Model *</Label> 
                        <Input 
                          id={`model-${racquet.id}`} 
                          value={racquet.model} 
                          onChange={(e) => handleUpdateRacquet(racquet.id, { model: e.target.value })} 
                          required 
                          className="mt-1 bg-white" 
                          placeholder="e.g. Astrox 100ZZ" 
                        /> 
                      </div> 
                    </div> 
                    <div> 
                      <Label htmlFor={`string-name-${racquet.id}`} className="text-gray-700">String Type *</Label> 
                      <Select 
                        value={racquet.stringName} 
                        onValueChange={(value) => handleUpdateRacquet(racquet.id, { stringName: value })} 
                        required 
                      > 
                        <SelectTrigger id={`string-name-${racquet.id}`} className="mt-1 bg-white"> 
                          <SelectValue placeholder="Select string type" /> 
                        </SelectTrigger> 
                        <SelectContent> 
                          {stringOptions.map((string) => ( 
                            <SelectItem key={string} value={string}> 
                              {string} ({formatCurrency(STRING_PRICES[string as keyof typeof STRING_PRICES] || 0)}) 
                            </SelectItem> 
                          ))} 
                        </SelectContent> 
                      </Select> 
                    </div> 
                    <div> 
                      <Label className="text-gray-700">Stringing Tension: {racquet.tension[0]} lbs *</Label> 
                      <div className="mt-4 space-y-2"> 
                        <Slider 
                          value={racquet.tension} 
                          onValueChange={(value) => handleUpdateRacquet(racquet.id, { tension: value })} 
                          min={20} 
                          max={32} 
                          step={1} 
                          className="w-full" 
                        /> 
                        <div className="flex justify-between text-xs text-gray-500"> 
                          <span>20 lbs (Light)</span> 
                          <span>26 lbs (Medium)</span> 
                          <span>32 lbs (Tight)</span> 
                        </div> 
                        {racquet.tension[0] > 28 && ( 
                          <p className="text-sm text-orange-600 font-medium"> 
                            ⚠️ High tension (&gt;28 lbs) may reduce durability on some frames. 
                          </p> 
                        )} 
                      </div> 
                    </div> 
                    <div> 
                      <Label htmlFor={`comments-${racquet.id}`} className="text-gray-700">Comments / Description</Label> 
                      <Textarea 
                        id={`comments-${racquet.id}`} 
                        value={racquet.comments} 
                        onChange={(e) => handleUpdateRacquet(racquet.id, { comments: e.target.value })} 
                        className="mt-2 text-gray-700 bg-white" 
                        placeholder="Any specific requests or details" 
                      /> 
                    </div> 
                  </div> 
                </div> 
              ))} 
              {racquets.length < 10 && ( 
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-2 text-brand-blue hover:text-brand-blue/80 hover:bg-blue-50" 
                  onClick={handleAddRacquet} 
                > 
                  + Add Another Racquet 
                </Button> 
              )} 
            </div> 
          </div> 

          {/* Pricing Estimation Bottom Bar */} 
          <div className="bg-gray-50 border-t p-6 rounded-b-xl border border-gray-200 mt-6"> 
            <div className="flex justify-between items-center mb-4"> 
              <span className="text-gray-600 font-medium">Expected Total for {racquets.length} Racquet{racquets.length > 1 ? 's' : ''}:</span> 
              <span className="text-2xl font-bold text-gray-900"> 
                {formatCurrency( 
                  racquets.reduce((total, r) => { 
                    let stringPrice = r.stringName ? STRING_PRICES[r.stringName as keyof typeof STRING_PRICES] || 0 : 0; 
                    return total + stringPrice; 
                  }, 0) 
                )} 
              </span> 
            </div> 
            <Button 
              type="submit" 
              variant="brand" 
              size="lg" 
              className="w-full text-lg py-6 shadow-xl animate-pulse-glow bg-brand-orange hover:bg-brand-orange/90" 
              disabled={loading || checkingPincode || pincodeStatus === 'invalid'} 
            > 
              {loading ? 'Processing...' : 'Add to Cart'} 
            </Button> 
          </div> 
        </form> 
      </CardContent> 
    </Card> 
  ) 
} 
