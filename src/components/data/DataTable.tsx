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

// Cột có thể khai báo meta.flex = true nếu muốn cột đó nhận toàn bộ khoảng trống còn dư.
function isFlexColumn(column: { id: string; columnDef: { meta?: unknown } }): boolean {
  const flag = (column.columnDef.meta as { flex?: boolean } | undefined)?.flex;
  return typeof flag === 'boolean' ? flag : false;
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
  const { columnSizingInfo, columnSizing, columnVisibility, sorting, columnFilters, rowSelection } = tableState;
  const isResizingAny = !!columnSizingInfo.isResizingColumn;
  const columnFilterCount = columnFilters.length;

  const visibleColumns = table.getVisibleLeafColumns();
  const lastColumnId = visibleColumns[visibleColumns.length - 1]?.id;
  const flatHeaders = table.getFlatHeaders();

  // Bộ biến CSS cho layout table cố định — tính lại khi resize / ẩn hiện cột / bật lọc.
  const columnSizeVars = React.useMemo(() => {
    const vars: Record<string, number> = {};
    for (const header of flatHeaders) {
      vars[`--header-${header.id}-size`] = header.getSize();
      vars[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return vars;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatHeaders, columnSizingInfo, columnSizing, columnVisibility, showFilters]);

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
        isResizingAny && 'cursor-col-resize select-none',
      )}
    >
      <table
        className="border-collapse text-left text-[13px] w-full"
        style={{ ...columnSizeVars, width: '100%', tableLayout: 'fixed' }}
      >
        <colgroup>
          {visibleColumns.map((column) => {
            const isFlex = isFlexColumn(column);
            return (
              <col
                key={column.id}
                style={{ width: isFlex ? 'auto' : `calc(var(--col-${column.id}-size) * 1px)` }}
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
                  const isResizing = header.column.getIsResizing();
                  const isFlex = isFlexColumn(header.column);
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        textAlign: align as 'left' | 'right' | 'center',
                        position: 'relative',
                        width: isFlex ? 'auto' : `calc(var(--header-${header.id}-size) * 1px)`,
                      }}
                      className={cn(
                        'bg-[var(--navy)] text-white group transition-colors duration-200',
                        dense ? 'px-3 py-2 text-[10px]' : 'px-3 py-3 text-[10.5px]',
                        'font-bold tracking-[0.06em] uppercase',
                        'border-r border-white/10',
                        isLast && 'border-r-0',
                        canSort && !isResizingAny && 'cursor-pointer select-none hover:bg-[var(--navy-deep)]',
                      )}
                      onClick={isResizingAny ? undefined : header.column.getToggleSortingHandler()}
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

                      {/* Tay kéo chỉnh rộng cột */}
                      {header.column.getCanResize() && !isLast && (
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="Chỉnh độ rộng cột"
                          className="absolute top-0 -right-1.5 h-full w-3 cursor-col-resize select-none touch-none z-10 group/resizer"
                        >
                          <div
                            className={cn(
                              'absolute right-1/2 translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full transition-all duration-150',
                              'w-0.5 h-1/2 bg-white/0',
                              'group-hover/resizer:bg-[var(--teal)]/60 group-hover/resizer:h-3/4',
                              isResizing && '!bg-[var(--teal)] !h-full !w-1',
                            )}
                          />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>

              {/* Hàng lọc theo cột (bật/tắt) */}
              {showFilters && (
                <tr className="bg-[var(--surface-soft)] border-b border-[var(--line-soft)]">
                  {hg.headers.map((header) => {
                    const isLast = header.column.id === lastColumnId;
                    const isFlex = isFlexColumn(header.column);
                    return (
                      <th
                        key={`filter-${header.id}`}
                        style={{ width: isFlex ? 'auto' : `calc(var(--header-${header.id}-size) * 1px)` }}
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
                  isResizingAny={isResizingAny}
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
  isResizingAny: boolean;
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
  isResizingAny,
}: RowProps<TData>) {
  return (
    <motion.tr
      layout={!isResizingAny}
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
        const isFlex = isFlexColumn(cell.column);
        return (
          <td
            key={cell.id}
            style={{
              textAlign: align as 'left' | 'right' | 'center',
              width: isFlex ? 'auto' : `calc(var(--col-${cell.column.id}-size) * 1px)`,
            }}
            className={cn(
              dense ? 'px-3 py-2' : 'px-3 py-3',
              'text-[13px] text-[var(--ink-soft)] font-medium align-middle border-r border-transparent transition-colors overflow-hidden',
              'group-hover:border-[var(--line-soft)]',
              isLast && 'group-hover:border-r-0',
            )}
          >
            <div className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
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
    prev.isResizingAny === next.isResizingAny &&
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
