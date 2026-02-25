const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Dropping foreign key constraint to decouple from auth schema temporarily...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_id_fkey"`);
        console.log("Constraint dropped successfully!");
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
