'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, List, LayoutGrid, Filter, Columns3, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataContext } from './DataContext';

interface DataToolbarProps {
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  primaryAction?: React.ReactNode;
  className?: string;
}

export function DataToolbar({
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  filters,
  primaryAction,
  className,
}: DataToolbarProps) {
  const {
    table,
    globalFilter,
    setGlobalFilter,
    showFilters,
    setShowFilters,
    hasGridView,
    viewMode,
    setViewMode,
  } = useDataContext();

  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setColMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleCount = table.getVisibleLeafColumns().length;
  const totalCount = table.getAllLeafColumns().length;
  const totalRows = table.getFilteredRowModel().rows.length;

  const segmentBase =
    'flex items-center justify-center h-full text-[11.5px] font-semibold transition-all duration-150 select-none';
  const segmentActive = 'bg-[var(--navy)] text-white';
  const segmentIdle = 'text-[var(--ink-soft)] hover:text-[var(--navy)] hover:bg-[var(--surface)]';
  const segmentDisabled = 'opacity-40 cursor-not-allowed text-[var(--mute)]';

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-3 px-3.5 py-3 md:px-5 md:py-2.5 border-b border-[var(--line-soft)] bg-[var(--surface)] shrink-0 z-[20] transition-colors',
        className,
      )}
    >
      {/* ── SEARCH ROW ── */}
      <div className="flex items-center justify-between md:justify-start gap-2 min-w-0 w-full md:w-auto md:flex-1">
        <div className="relative w-full md:w-auto md:flex-1 md:min-w-[220px] md:max-w-[480px] h-9.5 md:h-9 group">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mute)] transition-colors group-focus-within:text-[var(--teal-deep)] pointer-events-none" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full h-9.5 md:h-9 pl-9 pr-8 text-[13px] bg-[var(--surface-soft)] border border-[var(--line-soft)] rounded-xl outline-none transition-all duration-200',
              'text-ellipsis placeholder:text-[var(--mute)] text-[var(--ink)] font-medium',
              'focus:border-[var(--teal)]/40 focus:bg-[var(--surface)] focus:shadow-[0_0_0_3px_var(--teal-soft)]',
            )}
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-lg text-[var(--mute)] hover:bg-rose-50 hover:text-[var(--rose)] transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filters && (
          <div className="hidden md:flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">{filters}</div>
        )}
      </div>

      {/* ── MOBILE ROW 2: View toggle & primary action ── */}
      <div className="flex md:hidden items-center justify-between gap-2 w-full pt-1">
        <div className="flex items-center gap-1.5 shrink-0">
          {hasGridView && (
            <div className="flex items-center p-0.5 bg-[var(--surface-soft)] rounded-xl border border-[var(--line-soft)] h-9">
              {(['table', 'grid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'flex items-center justify-center w-8 h-7.5 rounded-lg transition-all duration-200',
                    viewMode === mode ? 'text-white bg-[var(--navy)] shadow-xs' : 'text-[var(--mute)] hover:text-[var(--ink)]',
                  )}
                  title={mode === 'table' ? 'Dạng bảng' : 'Dạng lưới'}
                >
                  {mode === 'table' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            disabled={viewMode === 'grid'}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200',
              viewMode === 'grid'
                ? 'opacity-50 cursor-not-allowed bg-[var(--surface-soft)] border-[var(--line-soft)] text-[var(--mute)]'
                : showFilters
                  ? 'bg-[var(--navy)] border-[var(--navy)] text-white shadow-xs'
                  : 'bg-[var(--surface-soft)] border-[var(--line-soft)] text-[var(--ink-soft)]',
            )}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
        {primaryAction && <div className="flex items-center gap-1.5 shrink-0">{primaryAction}</div>}
      </div>

      {/* ── MOBILE ROW 3: swipeable filters ── */}
      {filters && (
        <div className="flex md:hidden items-center gap-1.5 w-full overflow-x-auto no-scrollbar py-1 border-t border-[var(--line-soft)]/60 mt-1">
          {filters}
        </div>
      )}

      {/* ── DESKTOP RIGHT ── */}
      <div className="hidden md:flex items-center justify-end gap-2 shrink-0 ml-auto">
        {(table.getState().columnFilters.length > 0 || !!globalFilter) && (
          <button
            type="button"
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter('');
            }}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[11px] font-semibold text-[var(--rose)] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all active:scale-95 shrink-0"
          >
            <X className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}

        <div className="flex items-center h-9 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] shrink-0 divide-x divide-[var(--line-soft)]">
          <div className="flex items-center gap-1 px-3 h-full shrink-0">
            <span className="text-[12px] font-extrabold text-[var(--navy)] tabular-nums">{totalRows}</span>
            <span className="text-[10px] font-semibold text-[var(--mute)]">kq</span>
          </div>

          {hasGridView &&
            (['table', 'grid'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(segmentBase, 'w-9', viewMode === mode ? segmentActive : segmentIdle)}
                title={mode === 'table' ? 'Dạng bảng' : 'Dạng lưới'}
              >
                {mode === 'table' ? <List className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3" />}
              </button>
            ))}

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            disabled={viewMode === 'grid'}
            className={cn(
              segmentBase,
              'gap-1.5 px-3',
              viewMode === 'grid' ? segmentDisabled : showFilters ? segmentActive : segmentIdle,
            )}
          >
            <Filter className="w-2.5 h-2.5" />
            <span>Lọc cột</span>
          </button>
        </div>

        {/* Ẩn/hiện cột */}
        <div className="relative shrink-0" ref={colMenuRef}>
          <button
            type="button"
            onClick={() => setColMenuOpen((v) => !v)}
            disabled={viewMode === 'grid'}
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 rounded-xl border text-[11.5px] font-semibold transition-all duration-150',
              'bg-[var(--surface-soft)] border-[var(--line-soft)]',
              viewMode === 'grid'
                ? 'opacity-40 cursor-not-allowed text-[var(--mute)]'
                : colMenuOpen
                  ? 'bg-[var(--navy)] border-[var(--navy)] text-white'
                  : 'text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/50',
            )}
          >
            <Columns3 className="w-3 h-3" />
            <span>Cột</span>
            <ChevronDown className={cn('w-2.5 h-2.5 transition-transform duration-200', colMenuOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {colMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
              >
                <div className="px-4 py-3 bg-[var(--surface-soft)] border-b border-[var(--line-soft)]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-extrabold text-[var(--navy)] uppercase tracking-wider">
                      Cấu hình cột
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[var(--surface)] rounded-full border border-[var(--line-soft)] text-[var(--mute)]">
                      {visibleCount}/{totalCount}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--mute)]">Chọn các thông tin bạn muốn hiển thị</p>
                </div>
                <div className="py-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {table
                    .getAllLeafColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <label
                        key={col.id}
                        className="group flex items-center gap-3 px-4 py-2 hover:bg-[var(--navy-50)] cursor-pointer transition-colors"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={col.getIsVisible()}
                            onChange={col.getToggleVisibilityHandler()}
                            className="peer appearance-none w-4 h-4 border-2 border-[var(--line-strong)] rounded-md checked:bg-[var(--navy)] checked:border-[var(--navy)] transition-all cursor-pointer"
                          />
                          <Check className="w-2.5 h-2.5 absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={4} />
                        </div>
                        <span className="text-[12.5px] text-[var(--ink-soft)] font-semibold group-hover:text-[var(--navy)] transition-colors">
                          {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                        </span>
                      </label>
                    ))}
                </div>
                <div className="px-4 py-2.5 bg-[var(--surface-soft)] border-t border-[var(--line-soft)] flex gap-2">
                  <button
                    type="button"
                    onClick={() => table.toggleAllColumnsVisible(true)}
                    className="flex-1 py-1.5 text-[11px] font-bold text-[var(--navy)] bg-[var(--surface)] border border-[var(--line-soft)] rounded-lg hover:border-[var(--navy)] transition-all"
                  >
                    Hiện tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => table.toggleAllColumnsVisible(false)}
                    className="flex-1 py-1.5 text-[11px] font-bold text-[var(--mute)] bg-[var(--surface)] border border-[var(--line-soft)] rounded-lg hover:border-[var(--ink-soft)] transition-all"
                  >
                    Ẩn tất cả
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {primaryAction && (
          <div className="flex items-center pl-2 border-l border-[var(--line-soft)] shrink-0">{primaryAction}</div>
        )}
      </div>
    </div>
  );
}
