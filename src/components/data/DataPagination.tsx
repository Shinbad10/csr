'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolbarSelect } from './ToolbarSelect';
import { useDataContext } from './DataContext';
import { cn } from '@/lib/utils';

interface DataPaginationProps {
  className?: string;
  pageSizeOptions?: number[];
}

export function DataPagination({ className, pageSizeOptions = [20, 50, 100, 200, 500] }: DataPaginationProps) {
  const { table, total: serverTotal } = useDataContext();
  const { pageIndex, pageSize } = table.getState().pagination;
  const clientTotal = table.getFilteredRowModel().rows.length;
  const total = serverTotal !== undefined ? serverTotal : clientTotal;
  const pageCount = table.getPageCount();

  if (total === 0) return null;

  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const pages = buildPageNumbers(pageIndex, pageCount);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[var(--line)] bg-[var(--surface)] text-[12px] flex-shrink-0',
        className,
      )}
    >
      <span className="text-[var(--mute)] font-medium hidden sm:inline font-mono text-[11.5px]">
        Hiển thị <span className="font-bold text-[var(--ink)] tabular-nums">{from.toLocaleString('vi-VN')}–{to.toLocaleString('vi-VN')}</span> / <span className="font-bold text-[var(--ink)] tabular-nums">{total.toLocaleString('vi-VN')}</span> bản ghi
      </span>

      <div className="flex items-center gap-1">
        <PageBtn disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Trang trước">
          <ChevronLeft className="w-3.5 h-3.5" />
        </PageBtn>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-[var(--mute)] font-mono text-[12px]">
              …
            </span>
          ) : (
            <PageBtn key={p} active={p === pageIndex} onClick={() => table.setPageIndex(p as number)}>
              {(p as number) + 1}
            </PageBtn>
          ),
        )}

        <PageBtn disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Trang sau">
          <ChevronRight className="w-3.5 h-3.5" />
        </PageBtn>
      </div>

      <div className="flex items-center gap-2 text-[var(--mute)] font-mono text-[11.5px]">
        <span className="hidden sm:inline font-sans font-medium">Hiển thị:</span>
        <ToolbarSelect
          size="sm"
          searchable={false}
          value={String(pageSize)}
          onChange={(v) => table.setPageSize(Number(v))}
          options={pageSizeOptions.map((s) => ({ label: `${s} dòng/trang`, value: String(s) }))}
          className="w-auto min-w-[128px]"
          ariaLabel="Số dòng mỗi trang"
        />
      </div>
    </div>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center min-w-[30px] h-7 px-2 rounded-lg font-mono text-[11.5px] font-bold transition-all duration-150 cursor-pointer',
        active
          ? 'bg-[var(--navy)] text-white shadow-xs'
          : 'text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]',
        disabled && 'opacity-40 pointer-events-none cursor-default',
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '...')[] = [];
  const addPage = (p: number) => pages.push(p);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== '...') pages.push('...');
  };

  addPage(0);
  if (current > 3) addEllipsis();
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) addPage(i);
  if (current < total - 4) addEllipsis();
  addPage(total - 1);

  return pages;
}
