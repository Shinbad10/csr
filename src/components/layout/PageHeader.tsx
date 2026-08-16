"use client";

import React from "react";
import HelpGuide, { type GuideStep } from "./HelpGuide";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Các bước hướng dẫn sử dụng trang — hiện nút "Hướng dẫn" (tour tương tác) ở đầu trang */
  guide?: GuideStep[];
  /** Mẹo nhỏ hiển thị ở bước cuối của tour */
  guideTip?: string;
  /** Tên hiển thị cho tour (dùng khi title là JSX) */
  guideTitle?: string;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  // Helper to format string titles into VisiHub's signature editorial style (Fraunces + italic teal accent)
  const renderEditorialTitle = (t: React.ReactNode) => {
    if (typeof t !== "string") return t;
    const parts = t.trim().split(" ");
    if (parts.length <= 1) return t;
    
    // Pick the last 1 or 2 words to italicize in teal
    const accentCount = parts.length > 4 ? 2 : 1;
    const mainText = parts.slice(0, -accentCount).join(" ");
    const accentText = parts.slice(-accentCount).join(" ");

    return (
      <>
        <span>{mainText}</span>
        <span className="italic font-normal text-[var(--teal-deep)] ml-1.5">{accentText}</span>
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--line-strong)] px-4 sm:px-5 py-1.5 sm:py-2 shadow-xs animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[14.5px] sm:text-[16px] font-bold tracking-[-0.01em] text-[var(--ink)] leading-tight flex items-center flex-wrap">
            {renderEditorialTitle(title)}
          </h1>
          {description && (
            <div className="text-[11px] sm:text-[11.5px] text-[var(--mute)] mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
