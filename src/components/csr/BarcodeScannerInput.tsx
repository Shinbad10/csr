"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, Check, Loader2, Scan, RefreshCw } from "lucide-react";

interface BarcodeScannerInputProps {
  /** Hàm được gọi khi nhận diện thành công chuỗi quét trọn vẹn (hoặc khi bấm Enter / Áp dụng) */
  onScan: (rawText: string) => void;
  /** Mở modal quét bằng camera (Webcam/Mobile) */
  onOpenCamera?: () => void;
  /** Trạng thái tra cứu BHYT hiện tại (nếu có) */
  lookupStatus?: "idle" | "loading" | "ok" | "fail";
  lookupMsg?: string;
  onRetryLookup?: () => void;
  /** Thẻ BHYT tìm thấy (nếu có) */
  theBhytMa?: string;
  /** Auto focus khi mount */
  autoFocus?: boolean;
  /** Chế độ thu gọn (dùng cho modal sửa nhanh) */
  compact?: boolean;
  /** Hàm làm mới / xóa trắng form cha (nếu có) */
  onClear?: () => void;
}

export function BarcodeScannerInput({
  onScan,
  onOpenCamera,
  lookupStatus = "idle",
  lookupMsg = "",
  onRetryLookup,
  theBhytMa,
  autoFocus = true,
  compact = false,
  onClear,
}: BarcodeScannerInputProps) {
  // Local state để không gây re-render toàn bộ Modal cha (RegisterModal / EditInfoModal) khi máy quét gõ 150+ ký tự
  const [localScan, setLocalScan] = useState("");
  const [isScanningActive, setIsScanningActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const lastScanTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const localScanRef = useRef(localScan);
  const isScanningActiveRef = useRef(isScanningActive);

  useEffect(() => {
    onScanRef.current = onScan;
    localScanRef.current = localScan;
    isScanningActiveRef.current = isScanningActive;
  }, [onScan, localScan, isScanningActive]);

  const triggerApply = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    lastScanTimeRef.current = Date.now(); // Ghi nhận thời điểm vừa xử lý xong mã QR
    localScanRef.current = "";
    isScanningActiveRef.current = false;
    setLocalScan("");
    setIsScanningActive(false);
    onScanRef.current(clean);
    // Giữ focus ở lại ô quét để hứng hết bất kỳ ký tự dư thừa nào (\r, \n) hoặc tránh lọt ký tự vào ô CCCD phía dưới
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 15);
  }, []);

  // Nhận diện & debounce thông minh để không cắt ngang khi máy quét đang gõ dở địa chỉ Tiếng Việt
  useEffect(() => {
    if (!localScan || !localScan.trim()) {
      if (isScanningActiveRef.current) setIsScanningActive(false);
      return;
    }

    const str = localScan.trim();
    const p = str.split("|").map((s) => s.trim());

    if (str.length > 3) {
      lastScanTimeRef.current = Date.now();
      if (!isScanningActiveRef.current) {
        setIsScanningActive(true);
      }
    }

    // 1. Nếu là mã CCCD / VNeID đủ 7 trường chuẩn BCA: Số CCCD | Số CMND | Họ tên | Ngày sinh | Giới tính | Địa chỉ | Ngày cấp (8 số ddmmyyyy)
    // Khi p[6] đã có đủ 8 chữ số ngày cấp ở cuối -> chắc chắn 100% máy quét đã nhả trọn vẹn toàn bộ địa chỉ và kết thúc chuỗi
    if (p.length >= 7 && /^\d{12}$/.test(p[0]) && /^\d{8}$/.test(p[6].split(" ")[0])) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        triggerApply(str);
      }, 120);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // 2. Nếu là mã thẻ BHYT (đúng 15 ký tự gồm 2 chữ cái + 13 số, VD: DN4838321436964)
    if (/^[A-Za-z]{2}\d{13}$/.test(str)) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        triggerApply(str);
      }, 350);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // 3. Trường hợp CCCD 6 trường (chưa có hoặc không có trường ngày cấp thứ 7, hoặc đang trong quá trình gõ địa chỉ)
    // Buộc phải chờ ít nhất 1500ms (1.5 giây) không có ký tự mới để tránh NGẮT NGANG khi máy quét/Unikey đang gõ địa chỉ Tiếng Việt dài
    if (p.length >= 6 && /^\d{12}$/.test(p[0])) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        triggerApply(str);
      }, 1500);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [localScan, triggerApply]);

  // 1. Lắng nghe toàn cục ở pha Capture (capture: true) để chặn ngay Alt, F6, F10 từ máy quét/bộ gõ
  // trước khi trình duyệt Chrome/Edge kịp cướp focus lên thanh địa chỉ hoặc menu bar
  useEffect(() => {
    const handleGlobalCapture = (e: KeyboardEvent) => {
      // Chặn ngay các phím làm nhảy focus lên thanh địa chỉ (F6, Alt+D, Ctrl+L) hoặc menu trình duyệt (Alt, F10)
      if (
        e.key === "Alt" ||
        e.altKey ||
        e.key === "F6" ||
        e.key === "F10" ||
        (e.ctrlKey && (e.key.toLowerCase() === "l" || e.key.toLowerCase() === "d" || e.key.toLowerCase() === "t" || e.key.toLowerCase() === "n"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const now = Date.now();
      const isJustScanned = now - lastScanTimeRef.current < 1000; // Trong vòng 1000ms sau khi vừa xử lý xong mã QR
      const currentScan = localScanRef.current;
      const active = isScanningActiveRef.current;

      // Phát hiện máy quét mã QR đang quét dở chuỗi CCCD / VNeID (phát hiện dấu | đặc trưng)
      if (e.key === "|" && inputRef.current && document.activeElement !== inputRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (!active) setIsScanningActive(true);
        inputRef.current.focus();
        setLocalScan((prev) => prev + "|");
        return;
      }

      // Nếu đang trong quá trình nhận dữ liệu máy quét (hoặc vừa quét xong trong 1000ms)
      // KHÓA TUYỆT ĐỐI không cho bất kỳ phím/ký tự nào lọt xuống ô Số CCCD hay Họ tên hay bất kỳ ô input/textarea nào khác!
      if ((active || currentScan.includes("|") || isJustScanned) && inputRef.current && document.activeElement !== inputRef.current) {
        // Chặn phím không cho lọt vào ô input đang bị focus nhầm (như ô Số CCCD / Họ tên)
        e.preventDefault();
        e.stopPropagation();
        // Luôn kéo ngược focus về ô quét mã vạch để Unikey/EVKey không thể chèn ký tự composition vào ô Số CCCD bên dưới
        inputRef.current.focus();
        return;
      }

      // Nếu đang trong quá trình quét (isScanningActive hoặc có dấu |) mà focus bị lọt ra ngoài nút/body
      if (inputRef.current && document.activeElement !== inputRef.current) {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (targetTag !== "input" && targetTag !== "textarea" && targetTag !== "select") {
          if (e.key.length === 1 || e.key === "Enter" || e.key === "Tab" || e.key === "Backspace") {
            inputRef.current.focus();
          }
        }
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" || e.altKey || e.key === "F6" || e.key === "F10") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleGlobalCapture, true);
    window.addEventListener("keyup", handleGlobalKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalCapture, true);
      window.removeEventListener("keyup", handleGlobalKeyUp, true);
    };
  }, []);

  // Khóa focus khi đang quét dở dang (bị Alt hoặc Unikey làm blur giữa chừng)
  const handleBlur = () => {
    if (isScanningActive || (localScan.length > 0 && localScan.includes("|")) || Date.now() - lastScanTimeRef.current < 1000) {
      setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 15);
    }
  };

  // Ngăn chặn nhảy tab, phím tắt (keywork) và nhiễu từ Unikey/EVKey khi đang focus trong ô quét
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ƯU TIÊN 1: Chặn KIÊN QUYẾT các phím làm nhảy focus ra thanh địa chỉ hoặc menu trình duyệt (Alt, F6, F10, Tab...)
    // Máy quét mã vạch 2D hoặc Unikey khi xử lý dấu tiếng Việt có thể nhả phím Alt (Alt-numpad), F6 (focus address bar), F10
    if (
      e.key === "Alt" ||
      e.altKey ||
      e.key === "F6" ||
      e.key === "F10" ||
      e.key === "F3" ||
      e.key === "F1"
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // ƯU TIÊN 2: Ngăn nhảy Tab ra khỏi ô khi máy quét mã vạch gửi ký tự Tab giữa các trường hoặc cuối chuỗi
    if (e.key === "Tab" || e.keyCode === 9) {
      e.preventDefault();
      e.stopPropagation();
      if (localScan.includes("|") || isScanningActive) {
        setLocalScan((prev) => prev + " | ");
      }
      return;
    }

    // ƯU TIÊN 3: Máy quét mã vạch luôn gửi phím Enter khi kết thúc chuỗi
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      if (localScan.trim()) {
        triggerApply(localScan);
      }
      return;
    }

    // ƯU TIÊN 4: Nếu đang trong quá trình gõ tiếng Việt (IME composition - Unikey/EVKey),
    // SAU KHI đã chặn Alt/Tab/Enter ở trên, thì cho phép IME tự do chèn chữ vào ô input
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    // ƯU TIÊN 5: Chặn các phím tắt toàn cục (Ctrl+S, Ctrl+P, Escape...)
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "p" || e.key.toLowerCase() === "f") {
        e.preventDefault();
      }
      e.stopPropagation();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Alt" || e.altKey || e.key === "F6" || e.key === "F10") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (compact) {
    return (
      <div className="p-2.5 bg-[var(--teal-soft)]/40 rounded-xl border border-[var(--teal)]/20 flex items-center justify-between gap-3 flex-wrap transition-all">
        <span className="font-bold text-[13.5px] text-[var(--teal-deep)] shrink-0 flex items-center gap-2">
          <Scan className="w-4 h-4 text-[var(--teal-deep)] shrink-0" />
          <span>Quét thẻ BHYT & CCCD</span>
        </span>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-[310px] min-w-[200px]">
          <div
            onClick={() => inputRef.current?.focus()}
            className="bg-white rounded-lg border border-[var(--teal)]/50 px-3 h-9 flex items-center gap-2 focus-within:border-[var(--teal-deep)] focus-within:ring-2 focus-within:ring-[var(--teal)]/15 shadow-2xs transition-all w-full cursor-text relative group"
          >
            <input
              ref={inputRef}
              value={localScan}
              onChange={(e) => setLocalScan(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onBlur={handleBlur}
              style={{ outline: "none", boxShadow: "none", border: "none" }}
              placeholder="Nhập hoặc quét mã vạch..."
              className={`bg-transparent border-0 outline-none !outline-none focus:!outline-none focus:ring-0 focus:border-transparent focus-visible:!outline-none focus-visible:ring-0 text-[13px] font-mono font-bold w-full placeholder:text-[var(--mute)] placeholder:font-sans placeholder:font-normal min-w-0 ${localScan ? "text-transparent caret-[var(--teal-deep)]" : "text-[var(--ink)] caret-[var(--teal-deep)]"}`}
              autoFocus={autoFocus}
            />
            {localScan && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalScan("");
                  inputRef.current?.focus();
                }}
                className="text-[var(--mute)] hover:text-[var(--rose)] transition-colors cursor-pointer shrink-0 p-0.5"
                title="Xóa chuỗi quét"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {localScan && <span className="w-2 h-2 rounded-full bg-[var(--teal)] ring-2 ring-[var(--teal-soft)] animate-ping shrink-0" />}
            <span title="Sẵn sàng nhận mã từ máy quét" className="shrink-0 flex items-center">
              <Scan className="w-4 h-4 text-[var(--teal-deep)] group-focus-within:scale-110 transition-transform" />
            </span>
          </div>
          {onOpenCamera && (
            <button
              type="button"
              onClick={onOpenCamera}
              className="sm:hidden w-9 h-9 shrink-0 rounded-lg border border-[var(--teal)]/40 bg-white hover:bg-[var(--teal-soft)] text-[var(--teal-deep)] transition-all flex items-center justify-center shadow-xs cursor-pointer"
              title="Quét bằng camera (Mobile)"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="w-9 h-9 shrink-0 rounded-lg border border-[var(--line-strong)] bg-white hover:bg-[var(--rose-soft)] text-[var(--mute)] hover:text-[var(--rose)] hover:border-[var(--rose)]/40 transition-all flex items-center justify-center shadow-xs cursor-pointer"
              title="Làm mới form (Xóa trắng dữ liệu)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 bg-gradient-to-r from-[var(--teal-soft)]/60 via-[var(--teal-soft)]/30 to-[var(--surface-bg)] rounded-xl border border-[var(--teal)]/30 flex items-center justify-between gap-3 flex-wrap shadow-xs transition-all">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--teal)] text-white flex items-center justify-center shadow-2xs">
          <Scan className="w-4 h-4 animate-pulse" />
        </div>
        <span className="font-bold text-[13.5px] text-[var(--teal-deep)] tracking-tight">Quét thẻ BHYT & CCCD</span>
      </div>

      <div className="flex items-center gap-2.5 flex-1 sm:flex-initial sm:w-[320px] min-w-[220px]">
        {/* Ô focus quét thẻ — liền mạch, sạch sẽ, không viền kép */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="bg-white rounded-lg border border-[var(--teal)]/50 px-3 h-9 sm:h-10 flex items-center gap-2.5 focus-within:border-[var(--teal-deep)] focus-within:ring-2 focus-within:ring-[var(--teal)]/15 shadow-2xs transition-all w-full cursor-text relative group"
        >
          <input
            ref={inputRef}
            value={localScan}
            onChange={(e) => setLocalScan(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
            autoFocus={autoFocus}
            style={{ outline: "none", boxShadow: "none", border: "none" }}
            placeholder="Nhập hoặc quét mã vạch..."
            aria-label="Ô focus quét thẻ BHYT và CCCD"
            className={`bg-transparent border-0 outline-none !outline-none focus:!outline-none focus:ring-0 focus:border-transparent focus-visible:!outline-none focus-visible:ring-0 text-[13px] font-mono font-bold w-full placeholder:text-[var(--mute)] placeholder:font-sans placeholder:font-normal min-w-0 ${localScan ? "text-transparent caret-[var(--teal-deep)]" : "text-[var(--ink)] caret-[var(--teal-deep)]"}`}
          />
          {localScan && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLocalScan("");
                inputRef.current?.focus();
              }}
              className="text-[var(--mute)] hover:text-[var(--rose)] transition-colors cursor-pointer shrink-0 p-0.5"
              title="Xóa chuỗi quét"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {localScan && <span className="w-2 h-2 rounded-full bg-[var(--teal)] ring-2 ring-[var(--teal-soft)] animate-ping shrink-0" />}
          <span title="Sẵn sàng nhận mã từ máy quét" className="shrink-0 flex items-center">
            <Scan className="w-4 h-4 text-[var(--teal-deep)] group-focus-within:scale-110 transition-transform" />
          </span>
        </div>

        {/* Nút mở Camera — chỉ hiện khi ở giao diện mobile (sm:hidden) */}
        {onOpenCamera && (
          <button
            type="button"
            onClick={onOpenCamera}
            className="sm:hidden w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border border-[var(--teal)]/40 bg-white hover:bg-[var(--teal-soft)] text-[var(--teal-deep)] transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="Quét bằng camera (Mobile)"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border border-[var(--line-strong)] bg-white hover:bg-[var(--rose-soft)] text-[var(--mute)] hover:text-[var(--rose)] hover:border-[var(--rose)]/40 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="Làm mới form (Xóa trắng dữ liệu)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Trạng thái tra cứu BHYT (nếu có) */}
      {lookupStatus === "loading" && (
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--navy)] animate-fade-in w-full sm:w-auto">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[var(--teal-deep)]" /> <span className="truncate">{lookupMsg || "Đang tra cứu BHYT..."}</span>
        </div>
      )}
      {lookupStatus === "fail" && (
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--rose)] animate-fade-in w-full sm:w-auto">
          <X className="w-4 h-4 shrink-0 stroke-[3]" /> <span className="truncate">{lookupMsg}</span>
          {onRetryLookup && (
            <button type="button" onClick={onRetryLookup} className="text-[12px] font-bold underline hover:no-underline shrink-0 cursor-pointer">Thử lại</button>
          )}
        </div>
      )}
      {lookupStatus === "ok" && (
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--teal-deep)] animate-fade-in w-full sm:w-auto">
          <Check className="w-4 h-4 shrink-0 stroke-[3]" /> <span className="truncate">{lookupMsg}</span>
          {theBhytMa && <span className="font-mono bg-[var(--teal)] text-white px-2 py-0.5 rounded-md text-[11px] shrink-0">{theBhytMa}</span>}
        </div>
      )}
    </div>
  );
}
