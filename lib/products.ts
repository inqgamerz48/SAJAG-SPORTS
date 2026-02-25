export interface Product {
    id: string
    name: string
    description: string
    price: number
    images: string[]
    category: string
    sku: string
    stockCount: number
}

export const products: Product[] = [
    {
        id: 'racquet-keychain',
        name: 'Racquet Keychain',
        description: 'Miniature badminton racquet keychain. Perfect accessory for badminton lovers.',
        price: 550,
        category: 'Accessories',
        sku: 'ACC-KEY-001',
        stockCount: 50,
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
        price: 135,
        category: 'Collectibles',
        sku: 'COL-COURT-001',
        stockCount: 15,
        images: [
            '/products/badminton-court.jpeg',
            '/products/badminton-court-1.jpeg',
        ],
    },
    {
        id: 'cushion-wrap',
        name: 'Cushion Wrap',
        description: 'Soft cushion wrap for racquet handles. Provides better grip and comfort.',
        price: 270,
        category: 'Accessories',
        sku: 'ACC-WRAP-001',
        stockCount: 100,
        images: [
            '/products/cushion-wrap.jpeg',
            '/products/cushion-wrap-1.jpeg',
        ],
    },
    {
        id: 'racquet-keychain-gift-box',
        name: 'Racquet Keychain Gift Box',
        description: 'Beautiful gift box containing a miniature badminton racquet keychain.',
        price: 950,
        category: 'Accessories',
        sku: 'GIFT-KEY-001',
        stockCount: 20,
        images: [
            '/products/Badminton racquet gift box.JPG',
        ],
    },
]

export function getProduct(id: string): Product | undefined {
    return products.find((p) => p.id === id)
}
