"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import Tour, { type TourStep } from "./Tour";

/** Một bước hướng dẫn. Có `selector` = khoanh sáng đúng phần tử; không có = bước giới thiệu giữa màn hình. */
export type GuideStep = TourStep;

interface HelpGuideProps {
  title?: string;
  steps: GuideStep[];
  /** Mẹo nhỏ — thêm thành bước cuối ở giữa màn hình */
  tip?: string;
}

export default function HelpGuide({ title, steps, tip }: HelpGuideProps) {
  const [open, setOpen] = useState(false);

  const tourSteps: TourStep[] = tip
    ? [...steps, { title: "Mẹo nhỏ", desc: tip }]
    : steps;

  return (
    <>
      <button
        data-tour="help-btn"
        onClick={() => setOpen(true)}
        title="Xem hướng dẫn từng bước trên trang này"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--r-sm)] text-[12.5px] font-bold border transition-colors text-[var(--ink-soft)] bg-white border-[var(--line)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)]"
      >
        <PlayCircle className="w-4 h-4 text-[var(--teal-deep)]" /> Hướng dẫn
      </button>

      <Tour title={title} steps={tourSteps} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
