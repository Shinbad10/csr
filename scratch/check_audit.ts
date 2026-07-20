import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  const logs = await prisma.auditLog.findMany({
    orderBy: { thoiDiem: "desc" },
    take: 15
  });
  console.log("Recent AuditLog entries:");
  for (const l of logs) {
    console.log(`[${l.thoiDiem?.toISOString() || ""}] ${l.hanhDong} - ${l.bang} (${l.banGhiId}): ${l.thayDoi}`);
  }
}
main().catch(console.error);
