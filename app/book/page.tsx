'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RepairForm } from '@/components/repair-form'
import { StringingForm } from '@/components/stringing-form'
import { Wrench, Scissors, MapPin } from 'lucide-react'

type ServiceType = 'repair' | 'stringing' | null

export default function BookingPage() {
  // Wrap hook-using content in Suspense to satisfy useSearchParams requirement
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-600">Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  )
}

function BookingPageContent() {
  const searchParams = useSearchParams()
  const [serviceType, setServiceType] = useState<ServiceType>(null)

  // Preselect service when landing with ?service=stringing or ?service=repair
  useEffect(() => {
    const service = searchParams.get('service')
    if (service === 'stringing' || service === 'repair') {
      setServiceType(service)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {!serviceType ? (
          <>
            {/* Header (only for selection step) */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">Book a Service</h1>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Choose the service you need for your racquet
              </p>
            </div>

            {/* Service Selection */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Repair Service Card */}
              <Card
                className="border-2 border-gray-200 bg-white cursor-pointer transition-all duration-300 hover:border-brand-orange hover:scale-105 hover:shadow-xl"
                onClick={() => setServiceType('repair')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-brand-orange/10">
                      <Wrench className="h-6 w-6 text-brand-orange" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Racquet Repair
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    Pan-India service with pickup and delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-brand-orange">✓</span>
                      Carbon frame restoration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-brand-orange">✓</span>
                      Crack repair & frame fixing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-brand-orange">✓</span>
                      Pickup & delivery available
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Stringing Service Card */}
              <Card
                className="border-2 border-gray-200 bg-white cursor-pointer transition-all duration-300 hover:border-brand-blue hover:scale-105 hover:shadow-xl relative"
                onClick={() => setServiceType('stringing')}
              >
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-brand-orange to-brand-red text-white text-xs font-bold px-3 py-1 rounded-full">
                    Same Day Delivery
                  </span>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-brand-blue/10">
                      <Scissors className="h-6 w-6 text-brand-blue" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Racquet Stringing
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-brand-orange" />
                    <span>Pune City Only</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-brand-blue">✓</span>
                      Professional stringing service
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-brand-blue">✓</span>
                      Same day pickup & drop
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-brand-blue">✓</span>
                      Wide range of premium strings
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* Form Display */
          <div>
            {serviceType === 'repair' ? <RepairForm /> : <StringingForm />}
          </div>
        )}
      </div>
    </div>
  )
}
