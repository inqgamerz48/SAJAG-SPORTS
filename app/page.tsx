import { HomePageClient } from '@/components/home-page-client'
import { prisma } from '@/lib/prisma'
import { MOCK_PRODUCTS } from '@/lib/mock-products'
import { unstable_cache } from 'next/cache'

export const revalidate = 60; // Enable ISR (cache for 60 seconds)

async function safeFetchProducts(args: Parameters<typeof prisma.product.findMany>[0]) {
  try {
    const dbProducts = await prisma.product.findMany(args)
    if (dbProducts.length > 0) return dbProducts
    return MOCK_PRODUCTS.slice(0, args?.take || 4)
  } catch (err) {
    console.warn('HomePage: prisma.product.findMany failed, falling back to mock products.', err)
    return MOCK_PRODUCTS.slice(0, args?.take || 4)
  }
}

const getCachedHomeProducts = unstable_cache(
  async (args: Parameters<typeof prisma.product.findMany>[0]) => {
    return safeFetchProducts(args);
  },
  ['home-products'],
  { revalidate: 60, tags: ['products'] }
)

export default async function HomePage() {
  const [rawProducts, rawAccessories] = await Promise.all([
    getCachedHomeProducts({
      where: { stockCount: { gt: -1 } },
      include: { colorVariants: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    getCachedHomeProducts({
      where: { stockCount: { gt: -1 }, category: 'Accessories' },
      include: { colorVariants: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  // Convert Decimal to number for ShopClient and null to undefined for imageUrl
  const formatProduct = (p: any) => ({
    ...p,
    price: Number(p.price),
    colorVariants: (p.colorVariants ?? []).map((v: any) => ({
      ...v,
      imageUrl: v.imageUrl ?? undefined
    }))
  });

  const products = rawProducts.map(formatProduct);
  const accessories = rawAccessories.map(formatProduct);

  return <HomePageClient initialProducts={products} accessoriesProducts={accessories} />;
}
