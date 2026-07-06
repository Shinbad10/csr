import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VISI · Khám tầm soát cộng đồng",
    short_name: "VISI CSR",
    description:
      "Hệ thống Quản lý Khám tầm soát cộng đồng & Tư vấn phẫu thuật — VISI Medical Group",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fc",
    theme_color: "#031da6",
    orientation: "portrait",
    categories: ["medical", "business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
