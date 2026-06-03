import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const newProducts = [
    {
      name: 'Racquet Keychain',
      sku: 'ACC-KEY-001',
      category: 'Accessories',
      price: 550,
      stockCount: 50,
      description: 'Miniature badminton racquet keychain. Perfect accessory for badminton lovers.',
      images: [
        '/products/racquet-keychain.jpeg',
        '/products/racquet-keychain-1.jpeg',
        '/products/racquet-keychain-2.jpeg',
      ]
    },
    {
      name: 'Badminton Court Model',
      sku: 'COL-COURT-001',
      category: 'Collectibles',
      price: 135,
      stockCount: 15,
      description: 'Detailed badminton court replica.',
      images: [
        '/products/badminton-court.jpeg',
        '/products/badminton-court-1.jpeg',
      ]
    },
    {
      name: 'Cushion Wrap',
      sku: 'ACC-WRAP-001',
      category: 'Accessories',
      price: 270,
      stockCount: 100,
      description: 'Soft cushion wrap for racquet handles. Provides better grip and comfort.',
      images: [
        '/products/cushion-wrap.jpeg',
        '/products/cushion-wrap-1.jpeg',
      ]
    },
    {
      name: 'Racquet Keychain Gift Box',
      sku: 'GIFT-KEY-001',
      category: 'Accessories',
      price: 950,
      stockCount: 20,
      description: 'Beautiful gift box containing a miniature badminton racquet keychain.',
      images: [
        '/products/Badminton racquet gift box.JPG',
      ]
    }
  ]

  console.log('Adding new products...')
  for (const product of newProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name }
    })
    
    if (!existing) {
      await prisma.product.create({
        data: product
      })
      console.log(`✓ Added: ${product.name}`)
    } else {
      console.log(`- Skipped: ${product.name} (already exists)`)
    }
  }

  // Remove Shuttlecock if there's one named 'Badminton Shuttlecock'
  const shuttlecock = await prisma.product.findFirst({
    where: { name: { contains: 'Shuttlecock', mode: 'insensitive' } }
  })
  if (shuttlecock) {
    await prisma.product.delete({
      where: { id: shuttlecock.id }
    })
    console.log(`✓ Removed: ${shuttlecock.name}`)
  }

  console.log('Done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
