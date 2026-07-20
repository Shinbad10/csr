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

export default function PageHeader({ title, description, actions, guide, guideTip, guideTitle }: PageHeaderProps) {
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
        <span className="italic font-normal text-[var(--teal)] ml-1.5">{accentText}</span>
      </>
    );
  };

  return (
    <div className="bg-white border-b border-[var(--line)] px-4 sm:px-6 py-4 sm:py-5 shrink-0 shadow-[var(--shadow-xs)] animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[21px] sm:text-[26px] xl:text-[28px] font-bold tracking-[-0.025em] text-[var(--ink)] leading-tight flex items-center flex-wrap">
            {renderEditorialTitle(title)}
          </h1>
          {description && (
            <div className="text-[12.5px] sm:text-[13px] text-[var(--mute)] mt-1 flex items-center gap-2 flex-wrap font-medium">
              {description}
            </div>
          )}
        </div>
        {(actions || guide) && (
          <div className="shrink-0 flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {actions}
            {guide && guide.length > 0 && <HelpGuide title={guideTitle || (typeof title === "string" ? title : undefined)} steps={guide} tip={guideTip} />}
          </div>
        )}
      </div>
    </div>
  );
}
