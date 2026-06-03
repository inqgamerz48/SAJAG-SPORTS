import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            include: { colorVariants: true }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();
        // If variants are provided, we calculate the total stock count from them
        const calculatedStock = data.colorVariants?.length > 0
            ? data.colorVariants.reduce((sum: number, v: any) => sum + (Number(v.stockCount) || 0), 0)
            : data.stockCount;

        const stockCount = Number(calculatedStock) || 0;
        const price = Number(data.price) || 0;

        const newProduct = await prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku,
                category: data.category,
                price: price,
                stockCount: stockCount,
                images: data.images || [],
                description: data.description || "",
                colorVariants: {
                    create: data.colorVariants?.map((v: any) => ({
                        colorName: v.colorName,
                        stockCount: Number(v.stockCount) || 0,
                        imageUrl: v.imageUrl || null,
                    })) || []
                }
            }
        });

        revalidateTag('products', 'default');

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error: any) {
        console.error("Error creating product:", error);
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
