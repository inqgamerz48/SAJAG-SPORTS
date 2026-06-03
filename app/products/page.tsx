import { ShopClient } from '@/components/shop/shop-client'
import { prisma } from '@/lib/prisma'
import { MOCK_PRODUCTS } from '@/lib/mock-products'

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    let rawProducts = [];
    try {
        rawProducts = await prisma.product.findMany({
            where: { stockCount: { gt: -1 } },
            include: { colorVariants: true },
            orderBy: { createdAt: 'desc' }
        });
        if (rawProducts.length === 0) {
            rawProducts = MOCK_PRODUCTS;
        }
    } catch (err) {
        console.warn('ProductsPage: prisma.product.findMany failed, falling back to mock products.', err);
        rawProducts = MOCK_PRODUCTS;
    }

    const products = rawProducts.map(p => ({
        ...p,
        price: Number(p.price),
        colorVariants: p.colorVariants.map(v => ({
            ...v,
            imageUrl: v.imageUrl ?? undefined
        }))
    }));

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
