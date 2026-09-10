import React from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/** Trạng thái rỗng dùng chung cho danh sách / bảng / lưới. */
export function Empty({
  icon: Icon = Inbox,
  title = "Không có dữ liệu",
  description,
  action,
  compact,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 gap-2" : "py-16 gap-3",
        className
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-[var(--line-soft)] text-[var(--mute)]",
          compact ? "w-10 h-10" : "w-14 h-14"
        )}
      >
        <Icon className={compact ? "w-4.5 h-4.5" : "w-6 h-6"} />
      </div>
      <div>
        <p className={cn("font-semibold text-[var(--ink-soft)]", compact ? "text-[12.5px]" : "text-[14px]")}>
          {title}
        </p>
        {description && (
          <p className={cn("text-[var(--mute)] mt-1", compact ? "text-[11px]" : "text-[12.5px]")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default Empty;
