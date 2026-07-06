"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to format string titles into VisiHub's signature editorial style (Fraunces + italic teal accent)
  const renderEditorialTitle = (t: React.ReactNode) => {
    if (typeof t !== "string") return t;
    const parts = t.trim().split(" ");
    if (parts.length <= 1) return t;
    
    // Pick the last 1 or 2 words to italicize in teal
    const accentCount = parts.length > 3 ? 2 : 1;
    const mainText = parts.slice(0, -accentCount).join(" ");
    const accentText = parts.slice(-accentCount).join(" ");

    return (
      <>
        <span>{mainText}</span>
        <span className="italic font-normal text-[var(--teal)] ml-1.5">{accentText}</span>
      </>
    );
  };

  const titleString = typeof title === "string" ? title : "Chức năng";
  const portalTarget = mounted ? document.getElementById("topbar-title-portal") : null;

  return (
    <>
      {/* 1. Portal a subtle, small navigational breadcrumb into the Topbar (never the big H1 or actions!) */}
      {portalTarget &&
        createPortal(
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--ink-soft)] tracking-tight animate-fade-in">
            <span className="text-[var(--mute)] font-medium">VISI CSR</span>
            <span className="text-[var(--mute-soft)] text-[11px]">›</span>
            <span className="text-[var(--ink)] font-bold truncate max-w-[220px]">{titleString}</span>
          </div>,
          portalTarget
        )}

      {/* 2. Render the actual authoritative Page Header natively at the top of the content area */}
      <div className="bg-white border-b border-[var(--line)] px-6 py-5 shrink-0 shadow-[var(--shadow-xs)] animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-[26px] xl:text-[28px] font-bold tracking-[-0.025em] text-[var(--ink)] leading-tight flex items-center flex-wrap">
              {renderEditorialTitle(title)}
            </h1>
            {description && (
              <div className="text-[13px] text-[var(--mute)] mt-1 flex items-center gap-2 flex-wrap font-medium">
                {description}
              </div>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2.5 flex-wrap">{actions}</div>}
        </div>
      </div>
    </>
  );
}
