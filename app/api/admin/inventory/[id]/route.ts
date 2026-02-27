import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const data = await req.json();
        // If variants are provided, we calculate the total stock count from them
        const stockCount = data.colorVariants?.length > 0
            ? data.colorVariants.reduce((sum: number, v: any) => sum + (Number(v.stockCount) || 0), 0)
            : data.stockCount;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku,
                category: data.category,
                price: data.price,
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

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
