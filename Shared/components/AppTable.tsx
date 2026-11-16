import React from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { TableSkeleton } from './AppSkeleton';

export interface AppTableColumn<T = any> {
  key?: string;
  title: React.ReactNode;
  dataIndex?: keyof T | string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface AppTablePaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  onChange?: (page: number, pageSize?: number) => void;
}

export interface AppTableProps<T = any> {
  columns?: AppTableColumn<T>[];
  dataSource?: T[];
  data?: T[];
  rowKey?: string | ((record: T, index: number) => string);
  onRowClick?: (record: T, index: number) => void;
  loading?: boolean;
  emptyText?: string;
  pagination?: AppTablePaginationConfig | false;
  className?: string;
  wrapperClassName?: string;
  maxHeight?: string | number;
  children?: React.ReactNode;
}

export function AppTable<T extends object = any>({
  columns,
  dataSource,
  data,
  rowKey = 'id',
  onRowClick,
  loading = false,
  emptyText = 'No records found.',
  pagination,
  className = '',
  wrapperClassName = '',
  maxHeight = '31.25rem',
  children,
}: AppTableProps<T>) {
  const records = dataSource || data || [];

  // Pagination calculations
  const isPaginationEnabled = pagination !== false && Boolean(pagination);
  const currentPage = pagination && pagination.current ? pagination.current : 1;
  const pageSize = pagination && pagination.pageSize ? pagination.pageSize : 10;
  const totalItems =
    pagination && pagination.total !== undefined ? pagination.total : records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // If pagination is managed locally (no external total or total equals records.length)
  const isLocalPaging =
    isPaginationEnabled &&
    (pagination?.total === undefined || pagination.total === records.length);

  const displayedRecords = isLocalPaging
    ? records.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : records;

  const handlePrevPage = () => {
    if (currentPage > 1 && pagination && pagination.onChange) {
      pagination.onChange(currentPage - 1, pageSize);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && pagination && pagination.onChange) {
      pagination.onChange(currentPage + 1, pageSize);
    }
  };

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record, index);
    }
    const val = (record as any)[rowKey] || (record as any)._id || (record as any).id;
    return val ? String(val) : String(index);
  };

  return (
    <div className={`app-table-container w-full font-['Poppins','Inter',sans-serif] ${wrapperClassName}`}>
      {/* Scrollable Table View matching /admin/permissions layout */}
      <div
        className="kiran-role-table-scroll app-table-scroll"
        style={{ maxHeight, height: maxHeight ? 'auto' : undefined }}
      >
        <table className={`kiran-role-table app-table ${className}`}>
          {children ? (
            children
          ) : (
            <>
              {columns && (
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th
                        key={col.key || String(col.dataIndex) || idx}
                        style={{
                          width: col.width,
                          textAlign: col.align || 'left',
                        }}
                        className={col.className}
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              <tbody>
                {loading ? (
                  <TableSkeleton columns={columns?.length || 5} rows={pageSize || 5} />
                ) : displayedRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns?.length || 1}
                      className="py-12 text-center text-slate-400 font-normal"
                    >
                      {emptyText}
                    </td>
                  </tr>
                ) : (
                  displayedRecords.map((record, index) => {
                    const key = getRowKey(record, index);
                    return (
                      <tr
                        key={key}
                        onClick={() => onRowClick?.(record, index)}
                        className={onRowClick ? 'cursor-pointer' : undefined}
                      >
                        {columns?.map((col, colIdx) => {
                          const rawVal = col.dataIndex ? (record as any)[col.dataIndex] : undefined;
                          const cellContent = col.render
                            ? col.render(rawVal, record, index)
                            : rawVal !== undefined
                            ? String(rawVal)
                            : null;

                          return (
                            <td
                              key={col.key || String(col.dataIndex) || colIdx}
                              style={{ textAlign: col.align || 'left' }}
                              className={col.className}
                            >
                              {cellContent}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* Bottom Paginator matching /admin/permissions exactly */}
      {isPaginationEnabled && (
        <div className="paginator">
          <span>{totalItems} Items</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={handlePrevPage}
              title="Previous Page"
            >
              <LeftOutlined style={{ fontSize: 11 }} />
            </button>
            <span className="pagination-text px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={handleNextPage}
              title="Next Page"
            >
              <RightOutlined style={{ fontSize: 11 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppTable;
