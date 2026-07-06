"use client";

// Biểu đồ SVG thuần (không dependency) theo design tokens VISI.
// Palette phân loại đã qua validator dataviz (light: pass; dán nhãn trực tiếp để đủ tương phản).
import { useId, useState } from "react";

export const CHART_COLORS = [
  "#3452d8", "#0d9488", "#6366f1", "#d97706", "#9333ea", "#e11d48", "#0891b2", "#16a34a",
];

export type Slice = { label: string; value: number; color?: string };

const fmt = (n: number) => n.toLocaleString("vi-VN");

/* ─── Donut ─── vòng tròn phân loại, tâm hiển thị tổng, chú giải + % trực tiếp. */
export function Donut({ data, size = 200, thickness = 26, centerLabel = "Tổng" }: {
  data: Slice[]; size?: number; thickness?: number; centerLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + (d.value || 0), 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const GAP = total > 0 ? 2 : 0; // khe 2px giữa các lát
  let acc = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-hover)" strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const frac = (d.value || 0) / total;
            const len = Math.max(0, frac * C - GAP);
            const dash = `${len} ${C - len}`;
            const offset = -acc * C;
            acc += frac;
            const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
            return (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color}
                strokeWidth={hover === i ? thickness + 4 : thickness}
                strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="butt"
                style={{ transition: "stroke-width .15s", cursor: "default" }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-[26px] font-bold leading-none text-[var(--ink)]">{fmt(hover !== null ? data[hover].value : total)}</span>
          <span className="text-[10px] uppercase tracking-wide font-bold text-[var(--mute)] mt-1">{hover !== null ? data[hover].label : centerLabel}</span>
        </div>
      </div>
      <div className="flex-1 w-full grid grid-cols-1 gap-1.5 min-w-0">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={i} className="flex items-center gap-2 text-[12.5px] rounded-md px-1.5 py-0.5"
              style={{ background: hover === i ? "var(--surface-hover)" : "transparent" }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: color }} />
              <span className="font-medium text-[var(--ink-soft)] truncate flex-1">{d.label}</span>
              <span className="font-mono font-bold text-[var(--ink)]">{fmt(d.value)}</span>
              <span className="font-mono text-[var(--mute)] w-[38px] text-right">{pct}%</span>
            </div>
          );
        })}
        {total === 0 && <div className="text-[13px] text-[var(--mute)]">Chưa có dữ liệu.</div>}
      </div>
    </div>
  );
}

/* ─── Bar (dọc) ─── so sánh độ lớn, đỉnh bo 4px, nhãn số trực tiếp. */
export function BarChart({ data, height = 200, unit }: { data: Slice[]; height?: number; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId();
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  const plotH = height - 34; // chừa nhãn dưới + số trên

  return (
    <div className="w-full">
      <div className="flex items-end justify-around gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.round(((d.value || 0) / max) * plotH);
          const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={`${uid}-${i}`} className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <span className="font-mono text-[12px] font-bold text-[var(--ink)] mb-1">{fmt(d.value)}</span>
              <div className="w-full max-w-[64px] rounded-t-[4px] transition-all" style={{ height: Math.max(h, 2), background: color, opacity: hover === null || hover === i ? 1 : 0.55 }} />
              <span className="text-[11px] text-[var(--mute)] mt-2 text-center leading-tight line-clamp-2">{d.label}{unit ? ` (${unit})` : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
