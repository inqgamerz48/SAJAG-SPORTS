import { prisma } from "@/lib/prisma";
import { ShopClient } from "@/components/shop/shop-client";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { unstable_cache } from "next/cache";

// Revalidate data every 60 seconds
export const revalidate = 60;

const getCachedProducts = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          colorVariants: true
        }
      });
    } catch (err) {
      console.warn('ShopPage: prisma.product.findMany failed, falling back to mock products.', err);
      return MOCK_PRODUCTS;
    }
  },
  ['shop-products'],
  { revalidate: 60, tags: ['products'] }
);

export default async function ShopPage() {
  const products = await getCachedProducts();

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
      stockCount: v.stockCount,
      imageUrl: v.imageUrl ?? undefined
    })) : []
  }))

  return (
    <main>
      <ShopClient initialProducts={formattedProducts} />
    </main>
  );
}
