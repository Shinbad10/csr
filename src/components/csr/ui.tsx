/**
 * Thành phần trình bày dùng chung cho các màn hình làm việc CSR (Tư vấn, Theo dõi…)
 * — chuẩn UI công ty: token màu, badge bo 6px có chấm, ô nhập nền surface-soft + viền line.
 */
import React from "react";

export type Tone = "navy" | "teal" | "amber" | "rose" | "violet" | "gray";

export const TONE_CLS: Record<Tone, string> = {
  navy: "bg-[var(--navy-50)] text-[var(--navy)]",
  teal: "bg-[var(--teal-soft)] text-[var(--teal-deep)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber-deep)]",
  rose: "bg-[var(--rose-soft)] text-[var(--rose)]",
  violet: "bg-[#f3eaf8] text-[#7c3aed]",
  gray: "bg-[var(--line-soft)] text-[var(--mute)]",
};

/** Màu vạch trái / chấm đậm theo tông (dùng cho danh sách). */
export const TONE_SOLID: Record<Tone, string> = {
  navy: "var(--navy)",
  teal: "var(--teal)",
  amber: "var(--amber)",
  rose: "var(--rose)",
  violet: "#7c3aed",
  gray: "transparent",
};

export function Badge({ tone, children, title, dot = true }: { tone: Tone; children: React.ReactNode; title?: string; dot?: boolean }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap ${TONE_CLS[tone]}`}>
      {dot && <span className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}

/** Cặp "nhãn giá trị" nằm liền trong dòng — dùng cho dải thông tin bệnh nhân. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 min-w-0">
      <span className="text-[11.5px] text-[var(--mute)] shrink-0">{label}</span>
      <span className="text-[12.5px] text-[var(--ink)] font-medium min-w-0 truncate">{children}</span>
    </span>
  );
}

export const FIELD_LABEL = "text-[11.5px] font-semibold text-[var(--ink-soft)] mb-1.5 flex items-center gap-1.5";

export const INPUT_CLS =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] text-[13px] text-[var(--ink)] placeholder:text-[var(--mute-soft)] outline-none focus:bg-[var(--surface)] focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_var(--navy-100)] transition-all";

/** Thẻ khu vực làm việc (tiêu đề + mô tả + nội dung cuộn riêng). */
export function WorkCard({
  title,
  desc,
  aside,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`bg-[var(--surface)] border border-[var(--line)] rounded-[14px] shadow-[var(--shadow-sm)] flex flex-col min-h-0 overflow-hidden ${className}`}>
      <header className="px-5 py-3.5 border-b border-[var(--line-soft)] shrink-0 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[var(--ink)]">{title}</h3>
          {desc && <p className="text-[11.5px] text-[var(--mute)] mt-0.5">{desc}</p>}
        </div>
        {aside}
      </header>
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Nút phụ tông navy nhạt / teal nhạt / rose nhạt — theo vai trò thao tác. */
export const BTN_SOFT = {
  navy: "inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-[var(--navy)]/20 bg-[var(--navy-50)] text-[12.5px] font-semibold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  teal: "inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[12.5px] font-semibold text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:border-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  rose: "inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-rose-200 bg-[var(--rose-soft)] text-[12.5px] font-semibold text-[var(--rose)] hover:bg-[var(--rose)] hover:border-[var(--rose)] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  ghost: "inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] text-[12.5px] font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
};
