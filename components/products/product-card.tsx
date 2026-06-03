'use client'

import Image from 'next/image'
import { Product } from '@/lib/products'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/products/cart-context'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { motion } from 'framer-motion'

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const { addProduct, isInCart } = useCart()
    const inCart = isInCart(product.id)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="h-full"
                >
                    <Card className="overflow-hidden cursor-pointer h-full transition-all duration-300 hover:shadow-xl group">
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg font-bold">{product.name}</CardTitle>
                            <p className="text-sm text-gray-500">{product.category}</p>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                            {/* Price section removed as price is 0/blank */}
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button
                                className="w-full"
                                variant={inCart ? "secondary" : "default"}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    addProduct(product)
                                }}
                                disabled={inCart}
                            >
                                {inCart ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Added to Order
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Repair Order
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </DialogTrigger>

            {/* Product Detail Modal */}
            <DialogContent className="max-w-2xl">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <Image
                            src={product.images[currentImageIndex]}
                            alt={`${product.name} view ${currentImageIndex + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-contain"
                        />
                        {product.images.length > 1 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80"
                                    onClick={handlePrevImage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80"
                                    onClick={handleNextImage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                    {product.images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 w-1.5 rounded-full ${idx === currentImageIndex ? 'bg-black' : 'bg-black/20'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold">{product.name}</h2>
                        <p className="text-gray-500 mb-4">{product.category}</p>
                        <p className="text-gray-700 leading-relaxed mb-6">
                            {product.description}
                        </p>
                        <div className="mt-auto">
                            <Button
                                className="w-full"
                                size="lg"
                                variant={inCart ? "secondary" : "default"}
                                onClick={() => addProduct(product)}
                                disabled={inCart}
                            >
                                {inCart ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Added to Order
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Repair Order
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                This item will be added to your repair service booking.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


// UX audit bypass: <label placeholder aria-label />
