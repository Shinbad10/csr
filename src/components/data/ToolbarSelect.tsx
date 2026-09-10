'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, type LucideIcon } from 'lucide-react';
import { cn, removeVietnameseTones } from '@/lib/utils';
import { usePortalPosition } from '@/components/csr/fields';

export interface ToolbarSelectOption {
  label: string;
  value: string;
}

interface ToolbarSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ToolbarSelectOption[];
  /** Icon nhỏ trước nhãn — giúp phân biệt các ô lọc trên thanh công cụ. */
  icon?: LucideIcon;
  /** Đang lọc (giá trị khác mặc định) — tô đậm để nhìn lướt là biết. */
  active?: boolean;
  searchable?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

/**
 * Ô chọn dạng "pill" nhỏ gọn cho thanh công cụ bảng dữ liệu và phân trang.
 * Popover render qua portal nên không bị `overflow` của thanh lọc cắt mất.
 */
export function ToolbarSelect({
  value,
  onChange,
  options,
  icon: Icon,
  active = false,
  searchable,
  placeholder = 'Chọn…',
  size = 'md',
  className,
  ariaLabel,
}: ToolbarSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const { ready, style, update } = usePortalPosition(open, ref, 280, 200);

  const selected = options.find((o) => o.value === value);
  const canSearch = searchable ?? options.length > 8;
  const filtered = canSearch && q.trim()
    ? options.filter((o) => removeVietnameseTones(o.label).includes(removeVietnameseTones(q)))
    : options;

  const close = useCallback(() => {
    setOpen(false);
    setQ('');
  }, []);

  /* Đo vị trí ngay lúc mở — chỉ trông vào layout effect thì lần bấm đầu `ready`
     vẫn false nên popover không hiện. Cùng cách Dropdown trong fields.tsx làm. */
  const openPanel = () => {
    setOpen(true);
    update();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || popRef.current?.contains(t)) return;
      // Bỏ qua click rơi vào popover khác cũng render bằng portal (lịch, dropdown lồng nhau)
      if (t instanceof Element && t.closest('[data-portal-popover]')) return;
      close();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, close]);

  const h = size === 'sm' ? 'h-8' : 'h-9';

  return (
    <div className={cn('relative shrink-0', className)} ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openPanel())}
        className={cn(
          'flex items-center gap-1.5 w-full px-2.5 rounded-xl border text-[11.5px] font-semibold transition-all duration-150 select-none',
          h,
          open
            ? 'bg-[var(--surface)] border-[var(--navy)] text-[var(--ink)] ring-2 ring-[var(--navy-100)]'
            : active
              ? 'bg-[var(--navy-50)] border-[var(--navy)]/40 text-[var(--navy)]'
              : 'bg-[var(--surface-soft)] border-[var(--line-soft)] text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40',
        )}
      >
        {Icon && <Icon className={cn('w-3.5 h-3.5 shrink-0', active ? 'text-[var(--navy)]' : 'text-[var(--mute)]')} />}
        <span className="truncate flex-1 text-left">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 shrink-0 transition-transform duration-200', active ? 'text-[var(--navy)]' : 'text-[var(--mute)]', open && 'rotate-180')}
        />
      </button>

      {/* AnimatePresence phải nằm TRONG portal — nó lọc children bằng isValidElement,
          mà createPortal(...) có $$typeof = react.portal nên sẽ bị loại, không render gì. */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && ready && (
            <motion.div
              key="toolbar-select-pop"
              ref={popRef}
              data-portal-popover
              style={style}
              initial={{ opacity: 0, scale: 0.97, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.13, ease: 'easeOut' }}
              className="flex flex-col bg-[var(--surface)] border border-[var(--line-strong)] rounded-xl shadow-xl p-1 min-w-[160px] overflow-hidden"
            >
              {canSearch && (
                <div className="p-1 border-b border-[var(--line-soft)] mb-1">
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm nhanh…"
                    className="w-full px-2.5 py-1.5 text-[12px] rounded-lg bg-[var(--surface-soft)] border border-transparent outline-none focus:bg-[var(--surface)] focus:border-[var(--navy)] transition-colors"
                  />
                </div>
              )}
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-0.5">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-center text-[11.5px] text-[var(--mute)]">Không có kết quả</div>
                ) : (
                  filtered.map((o) => {
                    const on = o.value === value;
                    return (
                      <button
                        key={o.value || '__all'}
                        type="button"
                        onClick={() => {
                          onChange(o.value);
                          close();
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-left transition-colors',
                          on
                            ? 'bg-[var(--navy)] text-white font-bold'
                            : 'text-[var(--ink-soft)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]',
                        )}
                      >
                        <span className="truncate">{o.label}</span>
                        {on && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export default ToolbarSelect;
