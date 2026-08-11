"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Trash2, HelpCircle } from "lucide-react";
import Modal from "@/components/layout/Modal";

type ConfirmTone = "warning" | "danger" | "info";

export interface ConfirmOptions {
  title: string;
  /** Nội dung chính; xuống dòng bằng "\n" sẽ tách thành từng đoạn */
  message?: string;
  /** Dòng phụ in nhạt bên dưới nút, dùng cho cảnh báo hệ quả */
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);
/** Hộp thoại xác nhận dùng chung — thay `window.confirm`. Trả về Promise<boolean>. */
export const useConfirm = () => useContext(ConfirmCtx);

const TONE: Record<ConfirmTone, { icon: typeof AlertTriangle; iconCls: string; boxCls: string; btnCls: string }> = {
  warning: {
    icon: AlertTriangle,
    iconCls: "text-[var(--amber-deep)]",
    boxCls: "bg-[var(--amber-soft)] border-[var(--amber)]/25 border-l-[3px] border-l-[var(--amber)]",
    btnCls: "bg-[var(--amber-deep)] hover:bg-[var(--amber-ink)] text-white",
  },
  danger: {
    icon: Trash2,
    iconCls: "text-[var(--rose)]",
    boxCls: "bg-[var(--rose-soft)] border-[var(--rose)]/25 border-l-[3px] border-l-[var(--rose)]",
    btnCls: "bg-[var(--rose)] hover:bg-[#be123c] text-white",
  },
  info: {
    icon: HelpCircle,
    iconCls: "text-[var(--navy)]",
    boxCls: "bg-[var(--navy-50)] border-[var(--navy-100)] border-l-[3px] border-l-[var(--navy)]",
    btnCls: "btn-primary",
  },
};

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  // Giữ resolver của Promise đang chờ để nút bấm trả kết quả về đúng lời gọi
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  // Đóng bằng nút X / phím Esc / bấm nền = Huỷ, không được để lời gọi treo mãi
  const settle = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setOpts(null);
  }, []);

  const tone = TONE[opts?.tone || "warning"];
  const Icon = tone.icon;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {opts && (
        <Modal
          open
          onClose={() => settle(false)}
          title={opts.title}
          icon={Icon}
          maxWidth="max-w-[460px]"
          className="!z-[1200]"
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 w-full">
              <button type="button" onClick={() => settle(false)} className="btn btn-secondary h-10 px-4 text-[13px] font-bold cursor-pointer">
                {opts.cancelLabel || "Huỷ"}
              </button>
              <button type="button" autoFocus onClick={() => settle(true)} className={`btn h-10 px-5 text-[13px] font-bold cursor-pointer shadow-[var(--shadow-sm)] active:scale-[0.98] ${tone.btnCls}`}>
                {opts.confirmLabel || "Đồng ý"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {opts.message && (
              <div className={`flex items-start gap-3 p-3.5 rounded-[var(--r-lg)] border ${tone.boxCls}`}>
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${tone.iconCls}`} />
                <div className="min-w-0 space-y-1.5 text-[13.5px] leading-relaxed text-[var(--ink)]">
                  {opts.message.split("\n").filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            )}
            {opts.note && <p className="text-[12px] text-[var(--mute)] leading-relaxed">{opts.note}</p>}
          </div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}
