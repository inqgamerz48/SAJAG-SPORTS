"use client";

import { useCartStore } from "@/store/useCartStore";
import { MoveLeft, ShoppingBag, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { notFound } from "next/navigation";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [product, setProduct] = useState<any>(null);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const addItem = useCartStore((state) => state.addItem);

    // Simple helper to guess valid CSS color from text
    const getCSSColor = (colorName: string) => {
        const lower = colorName.toLowerCase();
        // Common colors 
        if (lower.includes('red')) return '#ef4444';
        if (lower.includes('blue')) return '#3b82f6';
        if (lower.includes('green')) return '#22c55e';
        if (lower.includes('yellow')) return '#eab308';
        if (lower.includes('orange')) return '#f97316';
        if (lower.includes('pur' + 'ple')) return '#' + 'a855' + 'f7';
        if (lower.includes('pink')) return '#ec4899';
        if (lower.includes('black')) return '#171717';
        if (lower.includes('white')) return '#fafafa';
        if (lower.includes('gray') || lower.includes('grey')) return '#737373';
        if (lower.includes('cyan')) return '#06b6d4';
        if (lower.includes('teal')) return '#14b8a6';
        // Fallback generic dark
        return '#000000';
    };

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
                if (data.colorVariants && data.colorVariants.length > 0) {
                    setSelectedVariant(data.colorVariants[0]);
                }
                setCurrentImageIndex(0);
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
            name: selectedVariant ? `${product.name} - ${selectedVariant.colorName}` : product.name,
            price: Number(product.price),
            quantity: 1,
            type: "physical",
            image: selectedVariant?.imageUrl || product.images?.[0],
            color: selectedVariant?.colorName
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
                    <div className="lg:sticky lg:top-32 w-full h-[50vh] lg:h-[70vh] bg-neutral-100 rounded-3xl overflow-hidden relative border flex items-center justify-center group">
                        {(() => {
                            const displayImages = selectedVariant?.imageUrl
                                ? [selectedVariant.imageUrl, ...(product.images || []).filter((img: string) => img !== selectedVariant.imageUrl)]
                                : (product.images || []);

                            if (displayImages.length > 0) {
                                return (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={displayImages[currentImageIndex]}
                                            alt={`${product.name} - Image ${currentImageIndex + 1}`}
                                            className="w-full h-full object-cover transition-all duration-300"
                                        />

                                        {displayImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setCurrentImageIndex((prev) => prev === 0 ? displayImages.length - 1 : prev - 1)}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Previous image"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={() => setCurrentImageIndex((prev) => prev === displayImages.length - 1 ? 0 : prev + 1)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Next image"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>

                                                {/* Dots indicator */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                                    {displayImages.map((img: string, idx: number) => (
                                                        <button
                                                            key={`${img}-${idx}`}
                                                            onClick={() => setCurrentImageIndex(idx)}
                                                            className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-black w-4' : 'bg-black/40 hover:bg-black/60'}`}
                                                            aria-label={`Go to image ${idx + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                );
                            } else {
                                return <ShoppingBag className="w-24 h-24 text-neutral-300" />;
                            }
                        })()}
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
                                    <span className={`w-2 h-2 rounded-full mr-3 ${(selectedVariant ? selectedVariant.stockCount : product.stockCount) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {(selectedVariant ? selectedVariant.stockCount : product.stockCount) > 0 ? "In Stock & Ready to Ship" : "Out of Stock"}
                                </div>
                            </div>

                            {/* Color Selection UI */}
                            {product.colorVariants && product.colorVariants.length > 0 && (
                                <div className="pt-2 pb-4 border-b">
                                    <h3 className="text-sm font-semibold text-neutral-900 mb-3 uppercase tracking-wider">Select Color</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colorVariants.map((v: any) => (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setSelectedVariant(v);
                                                    setCurrentImageIndex(0); // Reset to first image when changing color variant
                                                }}
                                                style={selectedVariant?.id === v.id ? { backgroundColor: getCSSColor(v.colorName), borderColor: getCSSColor(v.colorName) } : {}}
                                                className={`px-5 py-2.5 outline-none rounded-xl border-2 text-sm font-semibold transition-all duration-200 shadow-sm ${selectedVariant?.id === v.id
                                                    ? "text-white shadow-md scale-[1.02]"
                                                    : "border-neutral-200 text-neutral-700 bg-white hover:border-black/30 hover:bg-neutral-50"
                                                    } ${v.stockCount === 0 ? "opacity-40" : ""}`}
                                            >
                                                {v.colorName}
                                                {v.stockCount === 0 && <span className="ml-2 text-xs font-normal text-red-400 block sm:inline">(Out of Stock)</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="prose prose-neutral pt-4">
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
                                disabled={(selectedVariant ? selectedVariant.stockCount : product.stockCount) === 0}
                                className="w-full flex justify-center items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {(selectedVariant ? selectedVariant.stockCount : product.stockCount) > 0 ? "Add to Cart" : "Out of Stock"}
                                <ShoppingBag className="ml-2 w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
