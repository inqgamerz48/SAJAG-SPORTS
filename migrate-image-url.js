const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Adding column "repair_image_url" to "order_items"...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "order_items" ADD COLUMN "repair_image_url" TEXT;`);
        console.log('Successfully added column.');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Column already exists, skipping.');
        } else {
            console.error('Error:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
