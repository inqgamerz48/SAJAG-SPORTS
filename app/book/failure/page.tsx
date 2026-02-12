'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, RefreshCw, Phone } from 'lucide-react'

export default function FailurePage() {
    return (
        <Suspense fallback={<div className="py-12 text-center text-zinc-600">Loading...</div>}>
            <FailurePageContent />
        </Suspense>
    )
}

function FailurePageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const orderId = searchParams.get('order_id')
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')

    return (
        <div className="min-h-screen bg-white py-12 px-4 flex items-center justify-center">
            <Card className="max-w-md w-full border-2 border-red-200 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Payment Failed</CardTitle>
                    <CardDescription className="text-gray-600">
                        {reason === 'hash_mismatch'
                            ? 'Security verification failed. Please try again.'
                            : 'Your payment could not be processed at this time.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-sm text-red-800">
                        <p className="font-semibold mb-1">Transaction Details:</p>
                        {orderId && <p>Order ID: {orderId}</p>}
                        {status && <p>Status: {status}</p>}
                        <p className="mt-2">No money was debited from your account. If it was, it will be refunded automatically by your bank.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push('/payment')}
                            className="w-full bg-brand-orange hover:bg-brand-orange/90"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.open('https://wa.me/919876543210', '_blank')}
                            className="w-full border-zinc-200 text-zinc-700"
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            Contact Support
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
