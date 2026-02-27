"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, X, Check, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/useCartStore"
import { toast } from "sonner"
import Link from "next/link"

interface Product {
    id: string
    name: string
    sku: string
    category: string
    price: number
    stockCount: number
    images: string[]
    description: string | null
    colorVariants?: { colorName: string, stockCount: number, imageUrl?: string | null }[]
}

// Simple helper to guess valid CSS color from text
const getCSSColor = (colorName: string) => {
    const lower = colorName.toLowerCase();
    if (lower.includes('red')) return '#ef4444';
    if (lower.includes('blue')) return '#3b82f6';
    if (lower.includes('green')) return '#22c55e';
    if (lower.includes('yellow')) return '#eab308';
    if (lower.includes('orange')) return '#f97316';
    if (lower.includes('purple')) return '#a855f7';
    if (lower.includes('pink')) return '#ec4899';
    if (lower.includes('black')) return '#171717';
    if (lower.includes('white')) return '#fafafa';
    if (lower.includes('gray') || lower.includes('grey')) return '#737373';
    if (lower.includes('cyan')) return '#06b6d4';
    if (lower.includes('teal')) return '#14b8a6';
    return '#000000';
};

export function ShopClient({
    initialProducts,
    limit,
    hideHeader = false
}: {
    initialProducts: Product[],
    limit?: number,
    hideHeader?: boolean
}) {
    const [activeCategory, setActiveCategory] = useState<string>("All")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<{ colorName: string, stockCount: number, imageUrl?: string | null } | null>(null)
    const [quantity, setQuantity] = useState(1)
    const { addItem } = useCartStore()

    const categories = ["All", "Racquets", "Grips", "Strings", "Shuttlecocks", "Accessories"]

    let filteredProducts = activeCategory === "All"
        ? initialProducts
        : initialProducts.filter(p => p.category === activeCategory)

    if (limit) {
        filteredProducts = filteredProducts.slice(0, limit)
    }

    // Handle body scroll locking when drawer is open
    useEffect(() => {
        if (selectedProduct) {
            document.body.style.overflow = "hidden"
            // Auto-select first available variant
            if (selectedProduct.colorVariants && selectedProduct.colorVariants.length > 0) {
                const firstAvailable = selectedProduct.colorVariants.find(v => v.stockCount > 0) || selectedProduct.colorVariants[0];
                setSelectedVariant(firstAvailable);
            } else {
                setSelectedVariant(null);
            }
            setQuantity(1);
        } else {
            document.body.style.overflow = "unset"
        }
        return () => { document.body.style.overflow = "unset" }
    }, [selectedProduct])

    const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()

        // If product has variants but none selected (shouldn't happen with auto-select, but just in case)
        if (product.colorVariants && product.colorVariants.length > 0 && !selectedVariant) {
            toast.error("Please select a color first");
            return;
        }

        const maxStock = selectedVariant ? selectedVariant.stockCount : product.stockCount;
        if (quantity > maxStock) {
            toast.error(`Only ${maxStock} items available in stock`);
            return;
        }

        addItem({
            productId: product.id,
            name: selectedVariant ? `${product.name} - ${selectedVariant.colorName}` : product.name,
            price: Number(product.price),
            quantity: quantity,
            type: 'physical',
            image: product.images[0],
            color: selectedVariant?.colorName
        })
        toast.success(`${quantity}x ${product.name} added to cart!`)
        setSelectedProduct(null); // Close drawer after adding
    }

    return (
        <div className={hideHeader ? "w-full font-sans" : "min-h-screen bg-slate-50 pt-20 pb-20 font-sans"}>
            {!hideHeader && (
                <>
                    {/* Minimalist Header */}
                    <div className="bg-white border-b sticky top-16 z-30">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">The Store</h1>
                            <p className="text-slate-500 mt-2 text-lg">Premium gear for the modern athlete.</p>
                        </div>

                        {/* Sticky Filter Bar */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-4">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all ${activeCategory === category
                                            ? "bg-slate-900 text-white shadow-md"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence>
                        {filteredProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                key={product.id}
                                className="group cursor-pointer flex flex-col"
                                onClick={() => setSelectedProduct(product)}
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:border-slate-200 flex items-center justify-center">
                                    {product.images.length > 0 ? (
                                        <>
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                fill
                                                className={`object-contain p-6 transition-opacity duration-500 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
                                            />
                                            {product.images[1] && (
                                                <Image
                                                    src={product.images[1]}
                                                    alt={`${product.name} alternate view`}
                                                    fill
                                                    className="object-contain p-6 absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <ShoppingBag className="w-12 h-12 text-slate-200" />
                                    )}

                                    {/* Action Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 bg-gradient-to-t from-black/50 to-transparent">
                                        <Button
                                            className="w-full bg-white text-black hover:bg-slate-100 font-bold rounded-xl disabled:opacity-80"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const hasColors = product.colorVariants && product.colorVariants.length > 0;
                                                if (hasColors) {
                                                    setSelectedProduct(product);
                                                } else {
                                                    addItem({
                                                        productId: product.id,
                                                        name: product.name,
                                                        price: Number(product.price),
                                                        quantity: 1,
                                                        type: 'physical',
                                                        image: product.images[0]
                                                    });
                                                    toast.success(`1x ${product.name} added to cart!`);
                                                }
                                            }}
                                            disabled={(!product.colorVariants || product.colorVariants.length === 0) && product.stockCount <= 0}
                                        >
                                            {product.colorVariants && product.colorVariants.length > 0
                                                ? 'View Options'
                                                : (product.stockCount > 0 ? 'Add to Cart' : 'Out of Stock')
                                            }
                                        </Button>
                                    </div>

                                    {/* Badges */}
                                    {product.stockCount <= 0 && (
                                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Sold Out
                                        </div>
                                    )}
                                    {product.stockCount > 0 && product.stockCount < 5 && (
                                        <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Low Stock
                                        </div>
                                    )}
                                </div>

                                {/* Text Info */}
                                <div className="mt-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product.category}</p>
                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                                            {/* Color Dots */}
                                            {product.colorVariants && product.colorVariants.some(v => v.stockCount > 0) && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {product.colorVariants.filter(v => v.stockCount > 0).map((v, i) => (
                                                        <div
                                                            key={i}
                                                            title={v.colorName}
                                                            className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-sm"
                                                            style={{ backgroundColor: getCSSColor(v.colorName) }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-lg font-black text-brand-orange">₹{product.price}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-32">
                        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">No products found</h3>
                        <p className="text-slate-500">Try selecting a different category.</p>
                    </div>
                )}
            </div>

            {/* Slide-over Product Drawer */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-y-auto"
                        >
                            <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white/95 backdrop-blur z-10">
                                <h2 className="font-bold text-sm uppercase tracking-widest text-slate-400">Product Details</h2>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>

                            <div className="p-6 flex-grow">
                                <div className="aspect-square relative bg-slate-50 rounded-2xl mb-8 flex items-center justify-center p-8">
                                    {(selectedVariant?.imageUrl || selectedProduct.images[0]) ? (
                                        <Image
                                            src={selectedVariant?.imageUrl || selectedProduct.images[0]}
                                            alt={selectedVariant?.colorName ? `${selectedProduct.name} - ${selectedVariant.colorName}` : selectedProduct.name}
                                            fill
                                            className="object-contain p-8"
                                        />
                                    ) : (
                                        <ShoppingBag className="w-16 h-16 text-slate-200" />
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-2">{selectedProduct.category}</p>
                                        <h1 className="text-3xl font-black text-slate-900">{selectedProduct.name}</h1>
                                        <p className="text-2xl font-bold text-slate-700 mt-2">₹{selectedProduct.price}</p>
                                    </div>

                                    {/* Dynamic Stock Display Based on Selection */}
                                    <div className="flex items-center gap-2">
                                        {(selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount) > 0 ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                <Check className="w-3 h-3 mr-1" /> In Stock ({(selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount)})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                <X className="w-3 h-3 mr-1" /> Out of Stock
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 font-mono">SKU ID: {selectedProduct.sku}</span>
                                    </div>

                                    {/* Color Picker Drawer UI */}
                                    {selectedProduct.colorVariants && selectedProduct.colorVariants.length > 0 && (
                                        <div className="border-t border-b py-4 my-2">
                                            <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Select Color</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProduct.colorVariants.map((v, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setSelectedVariant(v);
                                                            setQuantity(1); // Reset quantity when changing variant
                                                        }}
                                                        disabled={v.stockCount === 0}
                                                        style={selectedVariant?.colorName === v.colorName ? { backgroundColor: getCSSColor(v.colorName), borderColor: getCSSColor(v.colorName) } : {}}
                                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 outline-none transition-all ${selectedVariant?.colorName === v.colorName
                                                            ? "text-white shadow-md scale-105"
                                                            : "border-slate-200 text-slate-700 bg-white hover:border-slate-300"
                                                            } ${v.stockCount === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                                                    >
                                                        {v.colorName}
                                                        {v.stockCount === 0 && <span className="block text-[10px] text-red-500 font-medium">Sold Out</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {selectedProduct.description || "A premium badminton product crafted for the highest level of competitive play. Built with advanced materials to provide maximum control and repulsion power."}
                                    </p>

                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <ShieldCheck className="w-5 h-5 text-brand-blue" />
                                            Authentic guaranteed product
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <Zap className="w-5 h-5 text-brand-orange" />
                                            Express delivery pan-India
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-slate-50 sticky bottom-0">
                                {/* Quantity Selector */}
                                <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-slate-200 p-2">
                                    <span className="text-sm font-semibold text-slate-700 ml-2">Quantity</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-lg min-w-[20px] text-center">{quantity}</span>
                                        <button
                                            onClick={() => {
                                                const maxStock = selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount;
                                                setQuantity(Math.min(maxStock, quantity + 1))
                                            }}
                                            disabled={quantity >= (selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount)}
                                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 text-lg font-bold rounded-xl bg-slate-900 text-white hover:bg-black shadow-lg shadow-black/10 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleAddToCart(selectedProduct)}
                                    disabled={(selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount) <= 0 || quantity > (selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount)}
                                >
                                    {(selectedVariant ? selectedVariant.stockCount : selectedProduct.stockCount) > 0 ? `Add ${quantity} to Cart - ₹${selectedProduct.price * quantity}` : 'Out of Stock'}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
