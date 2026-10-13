"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { Html5Qrcode } from "html5-qrcode";
import { MobileQrScanner } from "./MobileQrScanner";

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

const SCANNER_ID = "qr-camera-reader-box";
const MOBILE_QUERY = "(max-width: 767px), (pointer: coarse) and (max-width: 1024px)";

/** Điện thoại / máy tính bảng: quét toàn màn hình (giống ứng dụng bhyt-check); máy tính: hộp thoại. */
function useIsMobileScanner() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function CameraScannerModal({ open, onClose, onScan }: CameraScannerModalProps) {
  const isMobile = useIsMobileScanner();
  if (!open) return null;
  // Điện thoại: quét toàn màn hình bằng bộ quét riêng (giống bhyt-check); máy tính: hộp thoại html5-qrcode
  return isMobile ? <MobileQrScanner onScan={onScan} onClose={onClose} /> : <DesktopScanner onScan={onScan} onClose={onClose} />;
}

function DesktopScanner({ onClose, onScan }: Omit<CameraScannerModalProps, "open">) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Giữ hàm của trang cha trong ref: trang cha render lại thì camera không bị khởi động lại
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const initScanner = () => {
      if (!isMounted) return;
      const el = document.getElementById(SCANNER_ID);
      if (!el) {
        timerId = setTimeout(initScanner, 50);
        return;
      }

      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
            (decodedText) => {
              if (!isMounted) return;
              scanner.stop().catch(() => {}).finally(() => {
                scannerRef.current = null;
                onScanRef.current(decodedText);
                onCloseRef.current();
              });
            },
            () => {
              // Bỏ qua các khung hình chưa đọc được mã
            }
          )
          .then(() => {
            if (isMounted) setStarting(false);
          })
          .catch((err) => {
            if (!isMounted) return;
            setStarting(false);
            console.error("Camera start error:", err);
            setError("Không thể truy cập camera. Vui lòng kiểm tra quyền camera hoặc thử trình duyệt khác.");
          });
      } catch (err) {
        if (!isMounted) return;
        setStarting(false);
        console.error("Html5Qrcode init error:", err);
        setError("Lỗi khởi tạo trình quét mã. Vui lòng thử lại.");
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Quét mã QR bằng Camera"
      subtitle="Đưa mã QR trên thẻ BHYT / CCCD / VNeID vào khung quét để tự động điền"
      icon={Camera}
      maxWidth="max-w-[480px]"
      noPadding
    >
      <div className="p-6 bg-white space-y-5">
        <div className="relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-[var(--navy)]/30 bg-[var(--surface-soft)] min-h-[300px] flex flex-col items-center justify-center">
          {starting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-soft)]/90 z-10 gap-3 text-[var(--navy)] font-semibold text-[14px]">
              <RefreshCw className="w-6 h-6 animate-spin text-[var(--teal-deep)]" />
              <span>Đang khởi động camera...</span>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center space-y-3 max-w-[320px]">
              <div className="w-12 h-12 rounded-full bg-[var(--rose-soft)] text-[var(--rose)] flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="font-bold text-[14px] text-[var(--ink)]">Lỗi kết nối Camera</div>
              <div className="text-[12.5px] text-[var(--mute)] leading-relaxed">{error}</div>
            </div>
          ) : (
            <div id={SCANNER_ID} className="w-full h-full overflow-hidden rounded-xl" />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--mute)] font-medium px-1">
          <span>💡 Mẹo: Giữ thiết bị cố định và đủ ánh sáng</span>
          <span className="text-[var(--teal-deep)] font-bold">Camera sau (Mobile)</span>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[var(--line-soft)]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Đóng camera
          </button>
        </div>
      </div>
    </Modal>
  );
}
