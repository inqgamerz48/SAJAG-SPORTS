import { products } from '@/lib/products'
import { ProductCard } from '@/components/products/product-card'

export default function ProductsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">Shop & Accessories</h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-600">
                        Premium accessories and equipment to complement your game.
                        Add these to your repair order.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    )
}
