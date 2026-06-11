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
        console.error("Error fetching admin inventory products:", error);
        return NextResponse.json({ 
            error: "Failed to fetch products", 
            reason: "An unexpected database error occurred while fetching the product list." 
        }, { status: 500 });
    }
}

import { z } from "zod";

const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be non-negative"),
  stockCount: z.number().int().min(0, "Stock count must be non-negative"),
  images: z.array(z.string().url()).optional().default([]),
  description: z.string().optional().default(""),
  colorVariants: z.array(z.object({
    colorName: z.string().min(1, "Variant color name is required"),
    stockCount: z.number().int().min(0, "Variant stock count must be non-negative"),
    imageUrl: z.string().url().optional().nullable(),
  })).optional().default([]),
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = productCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
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
        return NextResponse.json({ 
            error: "Failed to create product", 
            reason: "An unexpected database error occurred while creating the product." 
        }, { status: 500 });
    }
}
