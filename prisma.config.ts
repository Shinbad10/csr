import "dotenv/config";
import { defineConfig } from "prisma/config";

const isLocal = process.argv.some((arg) => arg.includes("prisma-local"));

export default defineConfig({
  schema: isLocal ? "prisma-local/schema.prisma" : "prisma/schema.prisma",
  migrations: { path: isLocal ? "prisma-local/migrations" : "prisma/migrations" },
  datasource: {
    url: isLocal
      ? process.env["LOCAL_DATABASE_URL"] || "file:./local.db"
      : process.env["DATABASE_URL"],
  },
});
