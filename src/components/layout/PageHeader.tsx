"use client";

import { useEffect, useState } from "react";
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

  if (!mounted) return null;

  const target = document.getElementById("topbar-title-portal");
  if (!target) return null;

  return createPortal(
    <div className="flex items-center justify-between w-full">
      <div className="min-w-0 flex-1">
        <h1 className="font-serif text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)] flex items-center gap-2 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-3 ml-4">{actions}</div>}
    </div>,
    target
  );
}
