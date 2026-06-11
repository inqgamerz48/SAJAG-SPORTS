const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const count = await prisma.order.count();
  console.log("Orders count:", count);
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.dir(orders);
}

run().catch(console.error).finally(() => prisma.$disconnect());
