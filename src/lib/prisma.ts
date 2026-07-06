import "dotenv/config";
import { PrismaClient as CloudClient } from "@prisma/client";
import { PrismaClient as LocalClient } from "../../prisma-local/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbMode } from "./db-mode";

const g = global as unknown as { cloudPrisma?: CloudClient; localPrisma?: LocalClient };

// Parse chuỗi sqlserver://host:port;database=..;user=..;password=..;encrypt=..;trustServerCertificate=..
function parseSqlServerUrl(url: string) {
  const m = url.match(/sqlserver:\/\/([^;:]+)(?::(\d+))?;?(.*)/);
  if (!m) throw new Error("DATABASE_URL không hợp lệ");
  const params: Record<string, string> = {};
  m[3].split(";").forEach((p) => {
    const [k, v] = p.split("=");
    if (k && v) params[k.trim().toLowerCase()] = v.trim();
  });
  return {
    server: m[1],
    port: m[2] ? parseInt(m[2]) : 1433,
    database: params["database"] ?? "master",
    user: params["user"] ?? "sa",
    password: params["password"] ?? "",
    options: {
      encrypt: params["encrypt"] === "true",
      trustServerCertificate: params["trustservercertificate"] === "true",
    },
  };
}

export function getCloudPrisma(): CloudClient {
  if (g.cloudPrisma) return g.cloudPrisma;
  const adapter = new PrismaMssql(parseSqlServerUrl(process.env.DATABASE_URL || ""));
  const prisma = new CloudClient({ adapter, log: ["error"] });
  g.cloudPrisma = prisma;
  return prisma;
}

export function getLocalPrisma(): LocalClient {
  if (g.localPrisma) return g.localPrisma;
  const adapter = new PrismaBetterSqlite3({ url: process.env.LOCAL_DATABASE_URL || "file:./local.db" });
  const prisma = new LocalClient({ adapter, log: ["error"] });
  if (process.env.NODE_ENV !== "production") g.localPrisma = prisma;
  return prisma;
}

// Dùng ở mọi route handler. Hai schema giống nhau nên cast an toàn.
export function getPrisma(): CloudClient {
  return getDbMode() === "offline" ? (getLocalPrisma() as unknown as CloudClient) : getCloudPrisma();
}
