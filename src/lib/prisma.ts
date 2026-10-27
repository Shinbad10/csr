import "dotenv/config";
import { PrismaClient as CloudClient } from "@prisma/client";
import { PrismaClient as LocalClient } from "../../prisma-local/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbMode } from "./db-mode";

const g = global as unknown as { cloudPrisma?: CloudClient; localPrisma?: LocalClient };

// Giữ nguyên instance qua các lần hot-reload của Next dev.
// Trước đây module này xoá cache mỗi lần được nạp lại → mỗi lần sửa code là một pool
// SQL Server mới phải bắt tay TCP + đăng nhập TDS lại từ đầu (rất chậm với DB cloud),
// còn pool cũ thì rò rỉ kết nối. Chỉ xoá khi thật sự cần nạp Prisma Client vừa generate:
// đặt PRISMA_RESET_ON_RELOAD=1 trong .env rồi sửa một file bất kỳ.
if (process.env.PRISMA_RESET_ON_RELOAD === "1") {
  g.cloudPrisma?.$disconnect().catch(() => {});
  g.localPrisma?.$disconnect().catch(() => {});
  g.cloudPrisma = undefined;
  g.localPrisma = undefined;
}

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
    // Giữ sẵn kết nối "nóng". Mặc định min=0 + idle 30s khiến pool đóng hết kết nối lúc rảnh,
    // nên mỗi lần lưu lại phải bắt tay TCP + đăng nhập TDS lại từ đầu (rất tốn với DB đặt xa).
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 5 * 60_000,
    },
    connectionTimeout: 3_000,
    requestTimeout: 8_000,
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
  g.localPrisma = prisma;
  return prisma;
}

/** Đang tạm dùng SQLite tới thời điểm này (ms) vì SQL Server vừa mất kết nối. */
let fallbackUntil = 0;
const FALLBACK_MS = 60_000;

// Dùng ở mọi route handler. Hai schema giống nhau nên cast an toàn.
// Nếu SQL Server không kết nối được (ETIMEOUT), tự động chuyển sang local SQLite (local.db)
export function getPrisma(): CloudClient {
  if (getDbMode() === "offline" || Date.now() < fallbackUntil) {
    return getLocalPrisma() as unknown as CloudClient;
  }
  const cloud = getCloudPrisma();
  return new Proxy(cloud, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (typeof original === "object" && original !== null) {
        return new Proxy(original, {
          get(modelTarget, modelProp, modelReceiver) {
            const modelMethod = Reflect.get(modelTarget, modelProp, modelReceiver);
            if (typeof modelMethod === "function") {
              return async (...args: any[]) => {
                try {
                  return await modelMethod.apply(modelTarget, args);
                } catch (err: any) {
                  const errMsg = String(err?.message || err);
                  // Chỉ chuyển SQLite khi KHÔNG KẾT NỐI ĐƯỢC. Truy vấn chậm quá requestTimeout cũng mang mã
                  // ETIMEOUT ("Request failed to complete in …ms") — trước đây bị coi là mất kết nối nên cả 60s
                  // sau đó app đọc local.db (dữ liệu cũ, thiếu cột) dù SQL Server vẫn chạy bình thường.
                  const isRequestTimeout = /request failed to complete|timeout: request/i.test(errMsg);
                  const isConnError =
                    !isRequestTimeout &&
                    (err?.code === "ETIMEOUT" ||
                      err?.code === "ECONNREFUSED" ||
                      err?.code === "ESOCKET" ||
                      errMsg.includes("Failed to connect") ||
                      errMsg.includes("ETIMEOUT"));
                  if (isConnError) {
                    console.warn(
                      `[Prisma] SQL Server không kết nối được (${err?.code || "ETIMEOUT"}). Tạm dùng SQLite (local.db) ${FALLBACK_MS / 1000}s rồi thử lại SQL Server...`
                    );
                    // Tạm thời, KHÔNG vĩnh viễn: trước đây chỉ một lần timeout là dính offline tới khi khởi động
                    // lại tiến trình, trong khi local.db thường thiếu cột mới → mọi trang báo "column does not exist".
                    fallbackUntil = Date.now() + FALLBACK_MS;
                    const local = getLocalPrisma() as any;
                    const localModel = local[prop];
                    if (localModel && typeof localModel[modelProp] === "function") {
                      return await localModel[modelProp].apply(localModel, args);
                    }
                  }
                  throw err;
                }
              };
            }
            return modelMethod;
          },
        });
      }
      return original;
    },
  });
}
