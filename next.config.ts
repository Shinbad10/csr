import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "better-sqlite3", "mssql"],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
