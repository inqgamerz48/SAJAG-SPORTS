import { prisma } from "@/lib/prisma";
import { ShopClient } from "@/components/shop/shop-client";

// Revalidate data every hour
export const revalidate = 3600;

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      colorVariants: true
    }
  });

  // Convert Decimal prices to plain numbers for the Client Component
  const formattedProducts = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: Number(product.price),
    stockCount: product.stockCount,
    images: product.images,
    description: product.description,
    colorVariants: product.colorVariants ? product.colorVariants.map((v: any) => ({
      colorName: v.colorName,
      stockCount: v.stockCount
    })) : []
  }))

  return (
    <main>
      <ShopClient initialProducts={formattedProducts} />
    </main>
  );
}
