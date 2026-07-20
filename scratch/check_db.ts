import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  const cosos = await prisma.coSo.findMany();
  const users = await prisma.nguoiDungCSR.findMany();
  const buois = await prisma.buoiKham.findMany();
  console.log("CoSo:", cosos);
  console.log("Users:", users);
  console.log("BuoiKham count:", buois.length);
}

main().catch(console.error).finally(() => process.exit(0));
