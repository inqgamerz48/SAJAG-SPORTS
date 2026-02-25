"use client";

import { useCartStore } from "@/store/useCartStore";
import { MoveLeft, ShoppingBag, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { notFound } from "next/navigation";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${unwrappedParams.id}`);
                if (!res.ok) {
                    if (res.status === 404) notFound();
                    throw new Error("Failed");
                }
                const data = await res.json();
                setProduct(data);
            } catch (err) {
                toast.error("Error loading product");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [unwrappedParams.id]);

    const handleAddToCart = () => {
        if (!product) return;

        addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
            type: "physical",
            image: product.images?.[0],
        });

        toast.success("Added to cart!");
    };

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Loading product...</div>;
    }

    if (!product) return null;

    return (
        <div className="bg-white min-h-screen pt-16 lg:pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-8 transition">
                    <MoveLeft className="w-4 h-4 mr-2" /> Back to Store
                </Link>

                {/* Scrollytelling Layout */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">

                    {/* Left: Sticky Media View */}
                    <div className="lg:sticky lg:top-32 w-full h-[50vh] lg:h-[70vh] bg-neutral-100 rounded-3xl overflow-hidden relative border flex items-center justify-center">
                        {product.images && product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <ShoppingBag className="w-24 h-24 text-neutral-300" />
                        )}
                    </div>

                    {/* Right: Scrolling Content */}
                    <div className="pt-10 lg:pt-0">
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight">
                                    {product.name}
                                </h1>
                                <p className="mt-4 text-2xl font-semibold text-amber-600">
                                    ₹{Number(product.price).toLocaleString()}
                                </p>
                            </div>

                            <div className="border-t border-b py-6 space-y-4">
                                <div className="flex items-center text-sm text-neutral-600">
                                    <ShieldCheck className="w-5 h-5 text-amber-500 mr-2" />
                                    100% Authentic Product Guarantee
                                </div>
                                <div className="flex items-center text-sm text-neutral-600">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-3"></span>
                                    {product.stockCount > 0 ? "In Stock & Ready to Ship" : "Out of Stock"}
                                </div>
                            </div>

                            <div className="prose prose-neutral">
                                <h3 className="text-xl font-bold text-neutral-900">Technical Details</h3>
                                <p className="text-neutral-600 leading-relaxed text-lg pb-10">
                                    {product.description || "This premium badminton gear offers incredible control and precision. Designed for advanced players seeking unparalleled aerodynamic efficiency."}
                                </p>
                            </div>
                        </div>

                        {/* Thumb Zone 'Buy' Button for Mobile => Sticky on small screens */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 lg:relative lg:bg-transparent lg:border-t-0 lg:p-0 z-50 mt-10">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stockCount === 0}
                                className="w-full flex justify-center items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {product.stockCount > 0 ? "Add to Cart" : "Out of Stock"}
                                <ShoppingBag className="ml-2 w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
