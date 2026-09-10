"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopPageProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Tắt loading khi route đã thay đổi thành công
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Timeout an toàn: tự động tắt sau 4s nếu trang tải xong hoặc bị hủy
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Chỉ kích hoạt khi click vào thẻ <a> chuyển sang route khác
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Bỏ qua nếu click chuột phải, giữ phím Ctrl/Cmd/Shift/Alt, hoặc event đã bị chặn
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;
      if (target.target && target.target !== "_self") return;
      if (target.getAttribute("download") !== null) return;
      if (target.getAttribute("href")?.startsWith("#")) return;

      try {
        const url = new URL(target.href);
        // Bỏ qua nếu là link ngoài
        if (url.origin !== window.location.origin) return;
        // Bỏ qua nếu trùng cả pathname và query string (ở cùng 1 trang)
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;

        // Chỉ bật khi chuyển sang trang khác
        setLoading(true);
      } catch {}
    };

    window.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[3px] overflow-hidden pointer-events-none bg-transparent">
      <div className="h-full w-1/3 bg-gradient-to-r from-[var(--teal)] via-[#38e8d8] to-[var(--navy-light)] rounded-full animate-[topbar_1s_ease-in-out_infinite] shadow-[0_0_8px_var(--teal)]" />
      <style jsx global>{`
        @keyframes topbar {
          0% {
            transform: translateX(-100%) scaleX(0.4);
          }
          50% {
            transform: translateX(120%) scaleX(0.9);
          }
          100% {
            transform: translateX(320%) scaleX(0.3);
          }
        }
      `}</style>
    </div>
  );
}
