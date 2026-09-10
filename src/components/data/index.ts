// ── Bộ component hiển thị dữ liệu (TanStack Table v8) ──────────────────────
// Port từ VISIHUB, đổi icon Font Awesome -> lucide-react.
//
// Cách dùng:
//   <DataView columns={cols} data={rows} isLoading={loading} fullHeight>
//     <div className="card p-0 flex flex-col min-h-0 flex-1">
//       <DataToolbar searchPlaceholder="…" filters={controls} primaryAction={<button/>} />
//       <DataTable onRowClick={...} emptyIcon={Icon} />
//       {/* hoặc <DataGrid renderItem={...} /> cho dạng lưới */}
//       <DataPagination />
//     </div>
//   </DataView>

export { DataView } from './DataContext';
export type { ViewMode } from './DataContext';
export { useDataContext } from './DataContext';
export { DataToolbar } from './DataToolbar';
export { DataTable } from './DataTable';
export { DataGrid } from './DataGrid';
export { DataPagination } from './DataPagination';
export { ToolbarSelect } from './ToolbarSelect';
export type { ToolbarSelectOption } from './ToolbarSelect';
export { FilterCombobox } from './FilterCombobox';
export { useListFilters } from './useListFilters';
export type { CauHinhLoc } from './useListFilters';
