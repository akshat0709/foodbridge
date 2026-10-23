import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Eye,
  Search,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalRecords?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  onExportCsv?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
}

export function DataTable<T extends { _id?: string | number; id?: string | number }>({
  columns,
  data,
  totalRecords = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 25,
  onPageChange,
  onSort,
  onRowClick,
  onExportCsv,
  isLoading = false,
  emptyMessage = 'No records match the current filters.',
  searchPlaceholder,
  onSearch,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSortClick = (colKey: string) => {
    let nextDir: 'asc' | 'desc' = 'asc';
    if (sortKey === colKey && sortDir === 'asc') nextDir = 'desc';
    setSortKey(colKey);
    setSortDir(nextDir);
    onSort?.(colKey, nextDir);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch?.(val);
  };

  const displayedCols = columns.filter(col => visibleCols[col.key] !== false);

  return (
    <div className="rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col overflow-hidden">
      {/* Controls Bar */}
      <div className="px-3.5 py-2.5 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          {searchPlaceholder && (
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-text-muted-light dark:text-text-muted-dark" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-8 pr-3 py-1 text-xs rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark focus:outline-hidden"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-light dark:border-border-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-secondary-light dark:text-text-secondary-dark"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded shadow-lg p-2 z-30">
                <div className="text-[11px] font-semibold text-text-muted-light dark:text-text-muted-dark mb-1 px-1">
                  Toggle Columns
                </div>
                {columns.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key] !== false}
                      onChange={() =>
                        setVisibleCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))
                      }
                      className="rounded text-brand focus:ring-0"
                    />
                    <span>{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-light dark:border-border-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-secondary-light dark:text-text-secondary-dark"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Body with Sticky Header */}
      <div className="overflow-x-auto flex-1 max-h-[600px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#F2F1ED] dark:bg-[#1C1D20] text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark font-medium">
            <tr>
              {displayedCols.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSortClick(col.key)}
                  className={`px-3.5 py-2.5 font-medium whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:text-brand' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown className="w-3 h-3 text-text-muted-light dark:text-text-muted-dark opacity-70" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {displayedCols.map((_, j) => (
                    <td key={j} className="px-3.5 py-3">
                      <div className="h-3.5 bg-border-light dark:bg-border-dark rounded-xs w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={displayedCols.length}
                  className="px-4 py-8 text-center text-text-muted-light dark:text-text-muted-dark"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={(row as any)._id || (row as any).id || i}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
                      : ''
                  }`}
                >
                  {displayedCols.map(col => (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2.5 whitespace-nowrap text-text-primary-light dark:text-text-primary-dark ${
                        col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-3.5 py-2.5 border-t border-border-light dark:border-border-dark flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark">
        <div className="font-mono">
          Showing {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords.toLocaleString()} entries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1 rounded border border-border-light dark:border-border-dark disabled:opacity-30 hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono px-2 py-0.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark">
            {currentPage} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1 rounded border border-border-light dark:border-border-dark disabled:opacity-30 hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
