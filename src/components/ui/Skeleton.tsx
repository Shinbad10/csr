import React, { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean | string;
  className?: string;
  style?: CSSProperties;
}

/** Ô shimmer nền — nhận width/height/rounded qua prop hoặc className Tailwind. */
export function Skeleton({ width, height = 16, rounded, className, style }: SkeletonProps) {
  const borderRadius = rounded === true ? "9999px" : rounded || "6px";
  return (
    <div
      className={cn("skeleton-shimmer", className)}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export default Skeleton;
