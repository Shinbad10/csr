'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnSizingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  Table as TanTable,
} from '@tanstack/react-table';
import { cn, removeVietnameseTones } from '@/lib/utils';

export type ViewMode = 'table' | 'grid';

interface DataContextValue<TData> {
  table: TanTable<TData>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  globalFilter: string;
  setGlobalFilter: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  hasGridView: boolean;
  fullHeight?: boolean;
  isLoading?: boolean;
  total?: number; // dùng khi phân trang phía server
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataContext = createContext<DataContextValue<any> | null>(null);

export function useDataContext<TData>() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext must be used inside <DataView>');
  return ctx as DataContextValue<TData>;
}

interface DataViewProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  hasGridView?: boolean;
  fullHeight?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;

  // Phân trang phía server
  manualPagination?: boolean;
  pageCount?: number;
  total?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  /** Trang hiện tại do trang cha điều khiển (0-based). Truyền vào để reset khi đổi bộ lọc. */
  pageIndex?: number;
}

export function DataView<TData, TValue>({
  columns,
  data,
  pageSize = 50,
  hasGridView = false,
  fullHeight = false,
  isLoading = false,
  children,
  manualPagination,
  pageCount,
  total,
  onPaginationChange,
  pageIndex: controlledPageIndex,
}: DataViewProps<TData, TValue>) {
  const [mounted, setMounted] = React.useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isUserForcedViewMode, setIsUserForcedViewMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  // Khi trang cha điều khiển `pageIndex`, đó là nguồn sự thật; nếu không thì dùng state nội bộ.
  const pagination =
    controlledPageIndex !== undefined
      ? { pageIndex: controlledPageIndex, pageSize: internalPagination.pageSize }
      : internalPagination;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Tự chuyển sang dạng lưới trên mobile nếu trang có bật grid view và người dùng chưa tự chọn
  React.useEffect(() => {
    if (!hasGridView || isUserForcedViewMode) return;

    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setViewMode((prev) => {
        if (isMobile && prev !== 'grid') return 'grid';
        if (!isMobile && prev !== 'table') return 'table';
        return prev;
      });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [hasGridView, isUserForcedViewMode]);

  const handleSetViewMode = (mode: ViewMode) => {
    setIsUserForcedViewMode(true);
    setViewMode(mode);
  };

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    defaultColumn: {
      size: 120,
      minSize: 40,
      maxSize: 800,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const val = row.getValue(columnId);
      if (val == null) return false;
      const strVal = String(val);
      const query = String(filterValue).trim();
      if (!query) return true;
      // Tìm cả có dấu lẫn không dấu
      if (strVal.toLowerCase().includes(query.toLowerCase())) return true;
      return removeVietnameseTones(strVal).includes(removeVietnameseTones(query));
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      setInternalPagination(next);
      if (onPaginationChange) {
        onPaginationChange(next.pageIndex, next.pageSize);
      }
    },
    state: { sorting, globalFilter, columnFilters, columnVisibility, columnSizing, pagination, rowSelection },
  });

  const value = useMemo<DataContextValue<TData>>(
    () => ({
      table,
      viewMode,
      setViewMode: handleSetViewMode,
      globalFilter,
      setGlobalFilter,
      showFilters,
      setShowFilters,
      hasGridView,
      fullHeight,
      isLoading,
      total,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      table,
      viewMode,
      globalFilter,
      showFilters,
      hasGridView,
      fullHeight,
      isLoading,
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      pagination,
      total,
    ],
  );

  if (!mounted) return null;

  return (
    <DataContext.Provider value={value}>
      <div className={cn('flex flex-col relative', fullHeight ? 'h-full min-h-0' : 'w-full')}>
        {children}
      </div>
    </DataContext.Provider>
  );
}
