import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        include: { colorVariants: true },
    })
    console.dir(products, { depth: null })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
