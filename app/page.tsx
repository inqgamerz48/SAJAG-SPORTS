import { HomePageClient } from '@/components/home-page-client'
import { prisma } from '@/lib/prisma'

export const revalidate = 60; // Enable ISR (cache for 60 seconds)

async function safeFetchProducts(args: Parameters<typeof prisma.product.findMany>[0]) {
  try {
    return await prisma.product.findMany(args)
  } catch (err) {
    // Allow the build to succeed even when DATABASE_URL is unset (e.g. CI build
    // without secrets). At runtime ISR will retry and populate the cache.
    console.warn('HomePage: prisma.product.findMany failed, using empty list.', err)
    return []
  }
}

export default async function HomePage() {
  const [rawProducts, rawAccessories] = await Promise.all([
    safeFetchProducts({
      where: { stockCount: { gt: -1 } },
      include: { colorVariants: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    safeFetchProducts({
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
