"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Flashlight, AlertCircle, RefreshCw, Check } from "lucide-react";
import { motion } from "framer-motion";
import jsQR from "jsqr";

/*
  Quét QR toàn màn hình cho điện thoại — chép bộ quét của ứng dụng bhyt-check (đã chạy ổn với thẻ BHYT):
   - Camera sau 1080p, lấy nét liên tục.
   - Phóng to số (mặc định 3×): mỗi 300 ms cắt PHẦN GIỮA khung hình ở độ phân giải gốc rồi mới giải mã
     → mã QR nhỏ / dày trên thẻ BHYT vẫn đọc được.
   - Giải mã bằng BarcodeDetector có sẵn của máy (Android Chrome, iOS 17+), không có thì dùng jsQR.
   (html5-qrcode tính vùng giải mã theo kích thước khung HIỂN THỊ — với video phủ kín màn hình thì ảnh
   giải mã bị thu nhỏ & méo nên không đọc được; vì vậy điện thoại dùng bộ quét riêng này.)
*/

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };

const FRAME = "min(72vw, 300px)";
const MAX_DIM = 1024;
const ZOOM = 3;

export function MobileQrScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const doneRef = useRef(false);
  // Giữ hàm của trang cha trong ref: trang cha tạo hàm mới mỗi lần render thì camera cũng không bị mở lại
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Mở camera
  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
    const w = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike };
    if (w.BarcodeDetector) {
      try {
        detectorRef.current = new w.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detectorRef.current = null;
      }
    }

    let mounted = true;
    doneRef.current = false;

    const scanFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!mounted || doneRef.current) return; // đã đóng camera → dừng vòng quét
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) {
        timerRef.current = window.setTimeout(scanFrame, 300);
        return;
      }

      let decoded: string | null = null;
      try {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          let w = video.videoWidth;
          let h = video.videoHeight;
          if (w > MAX_DIM || h > MAX_DIM) {
            const r = Math.min(MAX_DIM / w, MAX_DIM / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          canvas.width = w;
          canvas.height = h;
          // Cắt đúng phần giữa khung hình tương ứng mức phóng to người dùng đang thấy
          const sw = video.videoWidth / ZOOM;
          const sh = video.videoHeight / ZOOM;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh, 0, 0, w, h);

          if (detectorRef.current) {
            try {
              const codes = await detectorRef.current.detect(canvas);
              if (codes.length > 0) decoded = codes[0].rawValue;
            } catch {
              // BarcodeDetector lỗi trên máy này → dùng jsQR
            }
          }
          if (!decoded) {
            const img = ctx.getImageData(0, 0, w, h);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code) decoded = code.data;
          }
        }
      } catch (e) {
        console.error("QR scan frame error:", e);
      }

      if (decoded && !doneRef.current) {
        doneRef.current = true;
        stopCamera();
        setSuccess(true);
        const text = decoded;
        // ✔ xanh 600 ms để người dùng biết đã quét được, rồi mới trả kết quả
        setTimeout(() => {
          onScanRef.current(text);
          onCloseRef.current();
        }, 600);
        return;
      }
      if (mounted) timerRef.current = window.setTimeout(scanFrame, 300);
    };

    const timer = setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // @ts-expect-error focusMode chưa có trong kiểu chuẩn nhưng Chrome/Android hỗ trợ
            focusMode: { ideal: "continuous" },
          },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true"); // iOS: không bung video gốc toàn màn hình
        await video.play();
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() || {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(Boolean(caps.torch));
        setLoading(false);
        timerRef.current = window.setTimeout(scanFrame, 300);
      } catch (err) {
        console.error("Camera init error:", err);
        if (mounted) {
          setError("Không thể truy cập camera. Vui lòng cấp quyền camera trong cài đặt trình duyệt.");
          setLoading(false);
        }
      }
    }, 150); // để lớp phủ vẽ xong trước — tránh giật / đen màn hình

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [stopCamera]);

  // iOS: quay lại từ nền / khoá màn hình thì phát lại video
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible" && videoRef.current?.srcObject) videoRef.current.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, []);

  // Khoá cuộn trang phía sau
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error("Flash toggle error:", e);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col pointer-events-auto select-none">
      {/* Video phóng to 3× đúng bằng vùng đang giải mã */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="w-full h-full object-cover"
          style={{ transform: `scale(${ZOOM})`, transformOrigin: "center center" }}
        />
      </div>

      {/* Lớp tối với ô trống ở giữa (đục lỗ bằng box-shadow — nhẹ, không lỗi GPU trên Safari) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] pointer-events-none z-10"
        style={{ width: FRAME, height: FRAME }}
      />

      {/* Khung ngắm: 4 góc teal + vạch quét; quét được thì ✔ xanh */}
      <motion.div
        initial={false}
        animate={success ? { scale: 1.05 } : { scale: 1 }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors duration-300 ${
          success ? "border-4 border-green-500 rounded-[20px] bg-green-500/20" : ""
        }`}
        style={{ width: FRAME, height: FRAME }}
      >
        {success ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.6)]"
            >
              <Check className="w-8 h-8 text-white stroke-[3]" />
            </motion.div>
          </div>
        ) : (
          <>
            <div className="absolute -top-[2px] -left-[2px] w-12 h-12 border-t-4 border-l-4 border-[var(--teal)] rounded-tl-[20px]" />
            <div className="absolute -top-[2px] -right-[2px] w-12 h-12 border-t-4 border-r-4 border-[var(--teal)] rounded-tr-[20px]" />
            <div className="absolute -bottom-[2px] -left-[2px] w-12 h-12 border-b-4 border-l-4 border-[var(--teal)] rounded-bl-[20px]" />
            <div className="absolute -bottom-[2px] -right-[2px] w-12 h-12 border-b-4 border-r-4 border-[var(--teal)] rounded-br-[20px]" />
            {!loading && !error && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--teal)] to-transparent shadow-[0_0_15px_var(--teal)]"
              />
            )}
          </>
        )}
      </motion.div>

      {/* Thanh trên: quay lại + đèn flash */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng camera"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        {torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? "Tắt đèn" : "Bật đèn"}
            className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all ${
              torchOn ? "border-yellow-400 bg-yellow-400/20 text-yellow-400" : "bg-black/40 border-white/10 text-white"
            }`}
          >
            <Flashlight className="w-5 h-5" />
          </button>
        )}
      </div>

      {loading && !error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black">
          <RefreshCw className="w-8 h-8 text-[var(--teal)] animate-spin" />
          <p className="text-zinc-400 text-xs font-black tracking-widest uppercase animate-pulse">Kích hoạt quang học…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 px-8">
          <div className="max-w-[320px] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--rose)]/20 text-[var(--rose)] flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="text-white font-bold text-[15px]">Không mở được camera</div>
            <div className="text-zinc-400 text-[13px] leading-relaxed">{error}</div>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-full bg-white/10 border border-white/15 text-white text-[13px] font-semibold active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {!error && (
        <div className="absolute left-0 right-0 z-20 flex justify-center px-6" style={{ bottom: "max(48px, calc(env(safe-area-inset-bottom) + 24px))" }}>
          <p className="text-white text-xs font-semibold text-center uppercase tracking-wider px-6 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {success ? "Đã quét được mã" : "Di chuyển khung quét đến mã QR"}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}
