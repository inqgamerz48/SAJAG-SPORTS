import { products } from '@/lib/products'
import { ShopClient } from '@/components/shop/shop-client'

export default function ProductsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">Shop & Accessories</h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-600">
                        Premium accessories and equipment to complement your game.
                    </p>
                </div>

                <ShopClient initialProducts={products} hideHeader />
            </div>
        </div>
    )
}
