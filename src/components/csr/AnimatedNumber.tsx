"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Thời gian chạy hiệu ứng (ms). Mặc định 750ms. */
  duration?: number;
  /** Hàm định dạng tùy chỉnh nếu có. */
  format?: (n: number) => string;
  className?: string;
  /** Số chữ số thập phân (mặc định 0). */
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

/** Easing curve: easeOutExpo cho cảm giác số chạy mượt và êm khi dừng. */
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export default function AnimatedNumber({
  value,
  duration = 750,
  format,
  className = "",
  decimals = 0,
  suffix = "",
  prefix = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(() =>
    typeof window === "undefined" ? value : 0
  );
  const prevValueRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = Number.isFinite(value) ? value : 0;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = startVal + (endVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = format
    ? format(displayValue)
    : decimals > 0
    ? `${prefix}${displayValue.toLocaleString("vi-VN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`
    : `${prefix}${Math.round(displayValue).toLocaleString("vi-VN")}${suffix}`;

  return <span className={className}>{formatted}</span>;
}
