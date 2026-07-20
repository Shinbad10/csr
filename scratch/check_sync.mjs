import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.syncQueue.count();
  console.log("SyncQueue count:", count);
  const rows = await prisma.syncQueue.findMany({ take: 5 });
  console.log("Sample rows:", rows);
  await prisma.$disconnect();
}
main();
