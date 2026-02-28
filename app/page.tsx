import { HomePageClient } from '@/components/home-page-client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const rawProducts = await prisma.product.findMany({
    where: { stockCount: { gt: -1 } },
    include: { colorVariants: true },
    orderBy: { createdAt: 'desc' },
    take: 4 // limit 4 for homepage featured products
  });

  const rawAccessories = await prisma.product.findMany({
    where: { stockCount: { gt: -1 }, category: 'Accessories' },
    include: { colorVariants: true },
    orderBy: { createdAt: 'desc' },
    take: 4 // limit 4 for homepage accessories
  });

  // Convert Decimal to number for ShopClient and null to undefined for imageUrl
  const formatProduct = (p: any) => ({
    ...p,
    price: Number(p.price),
    colorVariants: p.colorVariants.map((v: any) => ({
      ...v,
      imageUrl: v.imageUrl ?? undefined
    }))
  });

  const products = rawProducts.map(formatProduct);
  const accessories = rawAccessories.map(formatProduct);

  return <HomePageClient initialProducts={products} accessoriesProducts={accessories} />;
}
