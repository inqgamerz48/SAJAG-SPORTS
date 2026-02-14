export interface Product {
    id: string
    name: string
    description: string
    price: number
    images: string[]
    category: string
}

export const products: Product[] = [
    {
        id: 'racquet-keychain',
        name: 'Racquet Keychain',
        description: 'Miniature badminton racquet keychain. Perfect accessory for badminton lovers.',
        price: 0,
        category: 'Accessories',
        images: [
            '/products/racquet-keychain.jpeg',
            '/products/racquet-keychain-1.jpeg',
            '/products/racquet-keychain-2.jpeg',
        ],
    },
    {
        id: 'badminton-court',
        name: 'Badminton Court Model',
        description: 'Detailed badminton court replica.',
        price: 0,
        category: 'Collectibles',
        images: [
            '/products/badminton-court.jpeg',
            '/products/badminton-court-1.jpeg',
        ],
    },
    {
        id: 'badminton-shuttle',
        name: 'Badminton Shuttlecock',
        description: 'Premium shuttlecock.',
        price: 0,
        category: 'Equipment',
        images: [
            '/products/badminton.jpeg',
            '/products/badminton-1.jpeg',
        ],
    },
    {
        id: 'cushion-wrap',
        name: 'Cushion Wrap',
        description: 'Soft cushion wrap for racquet handles. Provides better grip and comfort.',
        price: 0,
        category: 'Accessories',
        images: [
            '/products/cushion-wrap.jpeg',
            '/products/cushion-wrap-1.jpeg',
        ],
    },
]

export function getProduct(id: string): Product | undefined {
    return products.find((p) => p.id === id)
}
