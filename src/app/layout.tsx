import type { Metadata, Viewport } from "next";
import { Roboto, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import PWARegister from "@/components/providers/PWARegister";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["vietnamese", "latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: "#031da6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "VISI · Khám tầm soát cộng đồng",
  description: "Hệ thống Quản lý Khám tầm soát cộng đồng & Tư vấn phẫu thuật — VISI Medical Group",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VISI CSR",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${roboto.variable} ${beVietnamPro.variable} ${jetbrains.variable} antialiased h-full`} suppressHydrationWarning>
      <body className="min-h-full font-sans bg-[var(--surface-bg)] text-[var(--ink)]" suppressHydrationWarning>
        <PWARegister />
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
