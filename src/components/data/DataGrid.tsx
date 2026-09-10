'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { useDataContext } from './DataContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Empty } from '@/components/ui/Empty';
import { cn } from '@/lib/utils';

type GridCols = 1 | 2 | 3 | 4 | 5 | 6;

interface DataGridProps<TData> {
  renderItem: (item: TData, index: number) => React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyIcon?: LucideIcon;
  cols?: GridCols;
  skeletonCount?: number;
  renderSkeleton?: (index: number) => React.ReactNode;
  className?: string;
}

const colClass: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
};

function DefaultSkeleton() {
  return (
    <div className="p-4 bg-[var(--surface)] border border-[var(--line-soft)] rounded-xl space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton height={40} className="w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton height={13} className="w-2/3" />
          <Skeleton height={11} className="w-1/2" />
        </div>
      </div>
      <Skeleton height={11} className="w-full" />
      <Skeleton height={11} className="w-3/4" />
    </div>
  );
}

export function DataGrid<TData>({
  renderItem,
  loading,
  emptyTitle = 'Không có dữ liệu',
  emptyDesc,
  emptyIcon,
  cols = 3,
  skeletonCount = 6,
  renderSkeleton,
  className,
}: DataGridProps<TData>) {
  const { table, viewMode, isLoading: ctxLoading } = useDataContext<TData>();

  if (viewMode !== 'grid') return null;

  const rows = table.getRowModel().rows;
  const isLoading = (loading ?? ctxLoading) && rows.length === 0;

  return (
    <div
      className={cn(
        'p-4 bg-[var(--surface-soft)] custom-scrollbar w-full pb-6 overflow-y-auto flex-1 min-h-0',
        className,
      )}
    >
      {isLoading ? (
        <div className={cn('grid gap-4', colClass[cols])}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <React.Fragment key={`skel-${i}`}>
              {renderSkeleton ? renderSkeleton(i) : <DefaultSkeleton />}
            </React.Fragment>
          ))}
        </div>
      ) : rows.length ? (
        <div className={cn('grid gap-4', colClass[cols])}>
          {rows.map((row, idx) => (
            <div key={row.id} className="h-full">
              {renderItem(row.original, idx)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 bg-[var(--surface)] rounded-xl border border-dashed border-[var(--line)]">
          <Empty icon={emptyIcon} title={emptyTitle} description={emptyDesc} compact />
        </div>
      )}
    </div>
  );
}
