import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductType = 'physical' | 'service';

export interface CartItem {
    id: string; // Unique ID for the cart item (could be different from productId if multiple of same service)
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    type: ProductType;
    image?: string;
    // Service specific fields
    serviceType?: 'stringing' | 'repair';
    racquetBrand?: string;
    racquetModel?: string;
    tension?: number;
    stringId?: string;
    stringName?: string;
    // Customer Info
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerPincode?: string;
    // Additional notes
    comments?: string;
    // Color variant info
    color?: string;
    // Repair Image Upload
    repairImageUrl?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                // Generate a pseudo-random ID for the cart item
                const id = Math.random().toString(36).substring(7);
                const newItem = { ...item, id };

                set((state) => {
                    // If it's a physical product, check if it already exists in cart to increment quantity
                    if (item.type === 'physical' && item.productId) {
                        const existingItem = state.items.find(
                            (i) => i.type === 'physical' && i.productId === item.productId
                        );

                        if (existingItem) {
                            return {
                                items: state.items.map((i) =>
                                    i.id === existingItem.id
                                        ? { ...i, quantity: i.quantity + item.quantity }
                                        : i
                                ),
                            };
                        }
                    }

                    // For services or new physical items, just add to array
                    return { items: [...state.items, newItem] };
                });
            },

            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),

            updateQuantity: (id, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
                    ),
                })),

            clearCart: () => set({ items: [] }),

            getTotalItems: () => {
                const state = get();
                return state.items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                const state = get();
                return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
            },
        }),
        {
            name: 'sajag-cart-storage',
        }
    )
);
