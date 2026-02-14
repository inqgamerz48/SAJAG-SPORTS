'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Product } from '@/lib/products'
import { toast } from 'sonner'

interface CartContextType {
    selectedProducts: Product[]
    addProduct: (product: Product) => void
    removeProduct: (productId: string) => void
    clearCart: () => void
    isInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sajag_cart')
        if (saved) {
            try {
                setSelectedProducts(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse cart', e)
            }
        }
    }, [])

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('sajag_cart', JSON.stringify(selectedProducts))
    }, [selectedProducts])

    const addProduct = (product: Product) => {
        if (selectedProducts.some((p) => p.id === product.id)) {
            toast.info(`${product.name} is already in your order`)
            return
        }
        setSelectedProducts((prev) => [...prev, product])
        toast.success(`${product.name} added to repair order`)
    }

    const removeProduct = (productId: string) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
        toast.success('Removed from order')
    }

    const clearCart = () => {
        setSelectedProducts([])
        localStorage.removeItem('sajag_cart')
    }

    const isInCart = (productId: string) => {
        return selectedProducts.some((p) => p.id === productId)
    }

    return (
        <CartContext.Provider
            value={{ selectedProducts, addProduct, removeProduct, clearCart, isInCart }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
