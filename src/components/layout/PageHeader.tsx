"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { type GuideStep } from "./HelpGuide";

interface PageHeaderProps {
  title: React.ReactNode;
  /** Phần cuối tiêu đề in nghiêng màu teal (company-ui). Bỏ trống + title là chuỗi → tự lấy 1–2 chữ cuối. */
  accent?: React.ReactNode;
  /** Biểu tượng trang — ô navy gradient bên trái tiêu đề */
  icon?: LucideIcon;
  /** Chip nhỏ cạnh tiêu đề: tên cơ sở, trạng thái… */
  badge?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Hàng phụ dưới tiêu đề (dải chỉ số, tab…), ngăn bằng đường kẻ mảnh */
  children?: React.ReactNode;
  className?: string;
  /** Các bước hướng dẫn sử dụng trang — hiện nút "Hướng dẫn" (tour tương tác) ở đầu trang */
  guide?: GuideStep[];
  /** Mẹo nhỏ hiển thị ở bước cuối của tour */
  guideTip?: string;
  /** Tên hiển thị cho tour (dùng khi title là JSX) */
  guideTitle?: string;
}

/**
 * Header chung của mọi trang (company-ui): [icon] Tiêu đề serif + phần nhấn nghiêng teal · chip · mô tả | thao tác.
 * Điện thoại: ẩn mô tả, thao tác xuống hàng dưới và tự xuống dòng (không cuộn ngang — popup chọn ngày không bị cắt).
 */
export default function PageHeader({ title, accent, icon: Icon, badge, description, actions, children, className = "" }: PageHeaderProps) {
  let main: React.ReactNode = title;
  let nhan: React.ReactNode = accent;
  if (nhan === undefined && typeof title === "string") {
    const parts = title.trim().split(" ");
    if (parts.length > 1) {
      const n = parts.length > 4 ? 2 : 1;
      main = parts.slice(0, -n).join(" ");
      nhan = parts.slice(-n).join(" ");
    }
  }

  return (
    <div className={`bg-[var(--surface)] rounded-xl border border-[var(--line)] px-3.5 sm:px-5 py-2.5 shadow-xs animate-fade-in ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] shadow-[var(--navy-shadow)] flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px] text-[var(--teal)]" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
              <h1 className="font-serif text-[17px] sm:text-[19px] font-semibold tracking-[-0.015em] text-[var(--ink)] leading-tight">
                {main}
                {nhan ? <span className="italic font-normal text-[var(--teal-deep)]"> {nhan}</span> : null}
              </h1>
              {badge && (
                <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy)]/15 text-[11px] font-semibold whitespace-nowrap">
                  {badge}
                </span>
              )}
            </div>
            {/* Mô tả chỉ hiện từ sm: trên điện thoại nó chiếm 2–3 dòng, đẩy nội dung chính xuống */}
            {description && (
              <div className="hidden sm:flex text-[12px] text-[var(--mute)] mt-0.5 items-center gap-1.5 flex-wrap">{description}</div>
            )}
          </div>
        </div>
        {actions && <div className="min-w-0 flex items-center gap-2 flex-wrap md:justify-end">{actions}</div>}
      </div>
      {children && <div className="mt-2.5 pt-2.5 border-t border-[var(--line-soft)]">{children}</div>}
    </div>
  );
}
