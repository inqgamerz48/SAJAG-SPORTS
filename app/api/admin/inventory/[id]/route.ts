import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const data = await req.json();
        const calculatedStock = data.colorVariants?.length > 0
            ? data.colorVariants.reduce((sum: number, v: any) => sum + (Number(v.stockCount) || 0), 0)
            : data.stockCount;

        const stockCount = Number(calculatedStock) || 0;
        const price = Number(data.price) || 0;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku,
                category: data.category,
                price: price,
                stockCount: stockCount,
                images: data.images,
                description: data.description,
                colorVariants: {
                    deleteMany: {},
                    create: data.colorVariants?.map((v: any) => ({
                        colorName: v.colorName,
                        stockCount: Number(v.stockCount) || 0,
                        imageUrl: v.imageUrl || null,
                    })) || []
                }
            }
        });

        revalidateTag('products', 'default');

        return NextResponse.json(updatedProduct);
    } catch (error: any) {
        console.error("Error updating product:", error);
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 });
        }
        return NextResponse.json({ 
            error: "Failed to update product", 
            reason: "An unexpected database error occurred while updating the product details." 
        }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.product.delete({
            where: { id }
        });

        revalidateTag('products', 'default');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ 
            error: "Failed to delete product", 
            reason: "An unexpected database error occurred while deleting the product." 
        }, { status: 500 });
    }
}
