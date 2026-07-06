import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "better-sqlite3", "mssql"],
};

export default nextConfig;
