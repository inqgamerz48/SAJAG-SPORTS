import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.product.updateMany({
    where: { sku: 'GIFT-KEY-001' },
    data: {
      images: ['/products/Badminton racquet gift box.JPG']
    }
  })
  
  console.log('Image path updated!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
