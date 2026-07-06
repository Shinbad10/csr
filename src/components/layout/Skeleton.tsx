"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Khối Skeleton cơ bản tạo hiệu ứng shimmer/pulse
 */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-[var(--surface-hover)] rounded-[var(--r-md)] animate-pulse ${className}`}
      {...props}
    />
  );
}

/**
 * Giả lập nhiều dòng văn bản (tiêu đề, đoạn văn)
 */
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        const widths = ["w-full", "w-[85%]", "w-[70%]", "w-[90%]", "w-[60%]"];
        const w = widths[i % widths.length];
        return <Skeleton key={i} className={`h-4 ${i === 0 ? "h-5 w-[40%] mb-3" : w}`} />;
      })}
    </div>
  );
}

/**
 * Giả lập danh sách thẻ (như danh sách bệnh nhân cột trái trong trang Khám)
 */
export function SkeletonList({ items = 6 }: { items?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="w-full rounded-[var(--r-md)] border border-[var(--line)] p-3 space-y-2 bg-white"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-[55%]" />
            <Skeleton className="h-4 w-[25%]" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Skeleton className="h-3.5 w-[45%]" />
            <Skeleton className="h-4 w-[60px] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Giả lập bảng dữ liệu nhiều cột (dành cho Hồ sơ, Đợt khám, Theo dõi, HIS)
 */
export function SkeletonTable({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[var(--line-soft)] animate-pulse">
          {Array.from({ length: cols }).map((_, c) => {
            const widths = ["w-[60px]", "w-[120px]", "w-[80px]", "w-[150px]", "w-[90px]", "w-[70px]", "w-[100px]", "w-[50px]"];
            const w = widths[(r + c) % widths.length];
            return (
              <td key={c} className="py-3.5 px-3.5 align-middle">
                <div className={`h-4 bg-[var(--surface-hover)] rounded ${w}`} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/**
 * Giả lập các ô input trong Form (tiếp nhận, khám bệnh, chỉnh sửa)
 */
export function SkeletonForm({ fields = 4, cols = 2 }: { fields?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-5`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/**
 * Giả lập bố cục 3 cột (dùng cho trang Khám & trang Tư vấn)
 */
export function Skeleton3Column() {
  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-hidden bg-[var(--surface-bg)] animate-fade-in">
      {/* Cột 1: Danh sách */}
      <aside className="w-full sm:w-[380px] xl:w-[310px] shrink-0 border-r border-[var(--line)] bg-white flex flex-col">
        <div className="p-3.5 border-b border-[var(--line)] flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="p-3 border-b border-[var(--line-soft)] flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SkeletonList items={6} />
        </div>
      </aside>

      {/* Cột 2: Thông tin BN + Timeline */}
      <section className="w-full xl:w-[380px] shrink-0 border-r border-[var(--line)] bg-white flex flex-col p-4 space-y-6">
        <div className="space-y-3 pb-4 border-b border-[var(--line-soft)]">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-56" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[90%]" />
            <Skeleton className="h-3.5 w-[80%]" />
            <Skeleton className="h-3.5 w-[85%]" />
          </div>
        </div>
        <div className="space-y-4 flex-1">
          <Skeleton className="h-4 w-36" />
          <div className="space-y-4 pl-2">
            <div className="flex gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cột 3: Phiếu khám lâm sàng */}
      <main className="flex-1 flex flex-col p-5 space-y-6 overflow-y-auto">
        <div className="card p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <SkeletonForm fields={2} cols={2} />
        </div>
        <div className="card p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <SkeletonForm fields={3} cols={1} />
        </div>
      </main>
    </div>
  );
}
