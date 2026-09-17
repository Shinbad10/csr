'use client';

import React from 'react';
import {
  flexRender,
  Row as TanRow,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Filter, X, Inbox, type LucideIcon } from 'lucide-react';
import { useDataContext } from './DataContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { FilterCombobox } from './FilterCombobox';

interface DataTableProps<TData> {
  loading?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  /** Icon lucide cho trạng thái rỗng. */
  emptyIcon?: LucideIcon;
  onRowClick?: (row: TData) => void;
  /** Class bổ sung theo từng dòng (ví dụ tô nền theo trạng thái). */
  rowClassName?: (row: TData, index: number) => string | undefined;
  striped?: boolean;
  stickyHeader?: boolean;
  dense?: boolean;
}

export function DataTable<TData>({
  loading,
  emptyTitle = 'Không có dữ liệu',
  emptyDesc,
  emptyIcon: EmptyIcon = Inbox,
  onRowClick,
  rowClassName,
  striped = true,
  stickyHeader: propsStickyHeader,
  dense = false,
}: DataTableProps<TData>) {
  const { table, viewMode, fullHeight, showFilters, isLoading: ctxLoading } = useDataContext<TData>();
  const stickyHeader = propsStickyHeader ?? fullHeight;
  const isLoading = loading ?? ctxLoading;

  const tableState = table.getState();
  const { columnVisibility, sorting, columnFilters, rowSelection } = tableState;
  const columnFilterCount = columnFilters.length;

  const visibleColumns = table.getVisibleLeafColumns();
  const lastColumnId = visibleColumns[visibleColumns.length - 1]?.id;
  const flatHeaders = table.getFlatHeaders();

  const totalTableWidth = React.useMemo(() => {
    let total = 0;
    for (const col of visibleColumns) {
      total += col.getSize();
    }
    return total;
  }, [visibleColumns]);

  // Bộ biến CSS cho layout table cố định — tính lại khi ẩn hiện cột / bật lọc.
  const columnSizeVars = React.useMemo(() => {
    const vars: Record<string, number> = {};
    for (const header of flatHeaders) {
      vars[`--header-${header.id}-size`] = header.getSize();
      vars[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return vars;
  }, [flatHeaders, columnVisibility, showFilters]);

  // Chữ ký state dùng để phá memo của từng dòng (ẩn/hiện cột, sắp xếp, lọc, chọn dòng).
  const rowStateVersion = React.useMemo(
    () =>
      `${JSON.stringify(columnVisibility)}-${JSON.stringify(sorting)}-${columnFilterCount}-${JSON.stringify(rowSelection)}`,
    [columnVisibility, sorting, columnFilterCount, rowSelection],
  );

  if (viewMode !== 'table') return null;

  return (
    <div
      className={cn(
        'overflow-x-auto relative bg-[var(--surface)] w-full custom-scrollbar',
        fullHeight ? 'flex-1 overflow-y-auto min-h-0' : 'overflow-y-auto max-h-full',
      )}
    >
      <table
        className="border-collapse text-left text-[13px] w-full min-w-full"
        style={{
          ...columnSizeVars,
          width: '100%',
          minWidth: totalTableWidth ? `${totalTableWidth}px` : '100%',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          {visibleColumns.map((column) => {
            const size = column.getSize();
            return (
              <col
                key={column.id}
                style={{ width: `${size}px` }}
              />
            );
          })}
        </colgroup>

        {/* ── HEAD ── */}
        <thead className={cn(stickyHeader && 'sticky top-0 z-[10] shadow-[0_1px_6px_rgba(0,0,0,0.08)]')}>
          {table.getHeaderGroups().map((hg) => (
            <React.Fragment key={hg.id}>
              <tr className="border-b border-white/10">
                {hg.headers.map((header) => {
                  const align = (header.column.columnDef.meta as { align?: string })?.align ?? 'left';
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const isLast = header.column.id === lastColumnId;
                  const size = header.getSize();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        textAlign: align as 'left' | 'right' | 'center',
                        position: 'relative',
                        width: `${size}px`,
                      }}
                      className={cn(
                        'bg-[var(--navy)] text-white group transition-colors duration-200',
                        dense ? 'px-3 py-2 text-[10px]' : 'px-3 py-3 text-[10.5px]',
                        'font-bold tracking-[0.06em] uppercase',
                        'border-r border-white/10',
                        isLast && 'border-r-0',
                        canSort && 'cursor-pointer select-none hover:bg-[var(--navy-deep)]',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          align === 'right' && 'justify-end',
                          align === 'center' && 'justify-center',
                        )}
                      >
                        <span className="whitespace-nowrap truncate">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>

                        {canSort && (
                          <div
                            className={cn(
                              'flex flex-col items-center justify-center -space-y-1.5 transition-all duration-200 shrink-0',
                              sorted ? 'opacity-100' : 'opacity-25 group-hover:opacity-60',
                            )}
                          >
                            <ChevronUp
                              className={cn('w-3 h-3', sorted === 'asc' ? 'text-[var(--teal)] scale-125' : 'text-white')}
                              strokeWidth={3}
                            />
                            <ChevronDown
                              className={cn('w-3 h-3', sorted === 'desc' ? 'text-[var(--teal)] scale-125' : 'text-white')}
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Hàng lọc theo cột (bật/tắt) */}
              {showFilters && (
                <tr className="bg-[var(--surface-soft)] border-b border-[var(--line-soft)]">
                  {hg.headers.map((header) => {
                    const isLast = header.column.id === lastColumnId;
                    const size = header.getSize();
                    return (
                      <th
                        key={`filter-${header.id}`}
                        style={{ width: `${size}px` }}
                        className={cn('px-3 py-2 border-r border-[var(--line-soft)]', isLast && 'border-r-0')}
                      >
                        {header.column.getCanFilter() ? (
                          <div className="relative group/filter">
                            {(() => {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const meta = header.column.columnDef.meta as any;
                              const filterOptions = meta?.filterOptions as { label: string; value: string }[] | undefined;

                              if (filterOptions) {
                                return (
                                  <FilterCombobox
                                    value={(header.column.getFilterValue() ?? '') as string}
                                    onChange={(val) => header.column.setFilterValue(val)}
                                    options={filterOptions}
                                  />
                                );
                              }

                              return (
                                <>
                                  <Filter className="w-2.5 h-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--mute)] group-focus-within/filter:text-[var(--navy)] transition-colors" />
                                  <input
                                    type="text"
                                    value={(header.column.getFilterValue() ?? '') as string}
                                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                                    placeholder="Lọc…"
                                    className="w-full h-7 pl-6 pr-6 py-1 bg-[var(--surface)] border border-[var(--line-soft)] rounded-md text-[10px] text-[var(--ink)] outline-none focus:border-[var(--navy)]/40 transition-all placeholder:text-[var(--mute)] min-w-0"
                                  />
                                  {(header.column.getFilterValue() as string) && (
                                    <button
                                      type="button"
                                      onClick={() => header.column.setFilterValue('')}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--rose)] transition-colors"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              )}
            </React.Fragment>
          ))}
        </thead>

        {/* ── BODY ── */}
        <tbody className="divide-y divide-[var(--line-soft)]">
          {isLoading && table.getRowModel().rows.length === 0 ? (
            <LoadingBody visibleColumnsCount={visibleColumns.length} />
          ) : (
            <AnimatePresence mode="sync" initial={false}>
              {table.getRowModel().rows.map((row, idx) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  striped={striped}
                  dense={dense}
                  onRowClick={onRowClick}
                  rowClassName={rowClassName}
                  lastColumnId={lastColumnId}
                  stateVersion={rowStateVersion}
                />
              ))}
            </AnimatePresence>
          )}
        </tbody>

        {!isLoading && table.getRowModel().rows.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={visibleColumns.length} className="py-20 text-center bg-[var(--surface)]">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[var(--surface-soft)] flex items-center justify-center">
                    <EmptyIcon className="w-6 h-6 text-[var(--mute)]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--ink)]">{emptyTitle}</h3>
                    {emptyDesc && <p className="text-[13px] text-[var(--mute)] mt-1">{emptyDesc}</p>}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────

interface RowProps<TData> {
  row: TanRow<TData>;
  idx: number;
  striped?: boolean;
  dense?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData, index: number) => string | undefined;
  lastColumnId?: string;
  stateVersion: string;
}

function DataTableRowInternal<TData>({
  row,
  idx,
  striped,
  dense,
  onRowClick,
  rowClassName,
  lastColumnId,
}: RowProps<TData>) {
  return (
    <motion.tr
      layout={false}
      onClick={
        onRowClick
          ? (e) => {
              const target = e.target as HTMLElement | null;
              if (
                target &&
                target.closest('button, a, input, select, textarea, [role="button"], [data-no-row-click]')
              ) {
                return;
              }
              onRowClick(row.original);
            }
          : undefined
      }
      className={cn(
        'group transition-colors duration-150',
        striped && idx % 2 === 1
          ? 'bg-[var(--surface-soft)] hover:bg-[var(--teal-softer)]'
          : 'bg-[var(--surface)] hover:bg-[var(--teal-softer)]',
        onRowClick && 'cursor-pointer',
        rowClassName?.(row.original, idx),
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const align = (cell.column.columnDef.meta as { align?: string })?.align ?? 'left';
        const isLast = cell.column.id === lastColumnId;
        const isActions = cell.column.id === 'actions';
        const noTruncate = isActions || (cell.column.columnDef.meta as { noTruncate?: boolean })?.noTruncate;
        const size = cell.column.getSize();
        return (
          <td
            key={cell.id}
            style={{
              textAlign: align as 'left' | 'right' | 'center',
              width: `${size}px`,
            }}
            className={cn(
              dense ? 'px-3 py-2' : 'px-3 py-3',
              'text-[13px] text-[var(--ink-soft)] font-medium align-middle border-r border-transparent transition-colors',
              !noTruncate && 'overflow-hidden',
              'group-hover:border-[var(--line-soft)]',
              isLast && 'group-hover:border-r-0',
            )}
          >
            <div className={cn(!noTruncate && 'truncate')}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
          </td>
        );
      })}
    </motion.tr>
  );
}

const DataTableRow = React.memo(DataTableRowInternal, (prev, next) => {
  return (
    prev.row.original === next.row.original &&
    prev.idx === next.idx &&
    prev.stateVersion === next.stateVersion &&
    prev.onRowClick === next.onRowClick &&
    prev.rowClassName === next.rowClassName
  );
}) as typeof DataTableRowInternal;

// ─── Skeleton body khi đang tải ───
function LoadingBody({ visibleColumnsCount }: { visibleColumnsCount: number }) {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <tr key={`skel-${i}`} className="bg-[var(--surface)]">
          {Array.from({ length: visibleColumnsCount }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <Skeleton height={14} rounded className="opacity-50" style={{ width: j === 0 ? '30%' : '75%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
