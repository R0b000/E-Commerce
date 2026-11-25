import React from 'react';
import { LeftOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
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
  footerLabel?: string;
  showFooter?: boolean;
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
  maxHeight,
  footerLabel = 'Total',
  showFooter,
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
    <div className={`app-table-container w-full h-full flex-1 font-['Poppins','Inter',sans-serif] flex flex-col min-h-0 ${wrapperClassName}`}>
      {/* Scrollable Table View matching /admin/permissions layout */}
      <div
        className="kiran-role-table-scroll app-table-scroll brand-table-scroll flex-1 min-h-0 overflow-auto"
        style={{ maxHeight, height: maxHeight ? 'auto' : '100%' }}
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

      {/* Signature Cyan Table Footer */}
      {(isPaginationEnabled || showFooter) && (
        <div className="px-6 h-[30px] min-h-[30px] bg-[#0096C7] text-white rounded-b-md flex items-center justify-between text-[11px] shadow-inner select-none w-full">
          {/* Left Side: Count */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-medium text-white/90 text-[11px] leading-none">{footerLabel}:</span>
            <span className="font-bold text-white text-[11px] leading-none">
              {totalItems} Items
            </span>
          </div>

          {/* Right Side: Pagination Controls (Rendered ONLY if totalItems > 10 and isPaginationEnabled) */}
          {isPaginationEnabled && totalItems > 10 && (
            <div className="flex items-center gap-2.5 leading-none">
              <div className="flex items-center gap-1.5 text-[10px] text-white/95 font-medium leading-none">
                <span>Rows:</span>
                <Dropdown
                  menu={{
                    items: [
                      { key: '10', label: <span className="font-semibold text-xs text-slate-800">10 / page</span> },
                      { key: '20', label: <span className="font-semibold text-xs text-slate-800">20 / page</span> },
                      { key: '50', label: <span className="font-semibold text-xs text-slate-800">50 / page</span> },
                      { key: '100', label: <span className="font-semibold text-xs text-slate-800">100 / page</span> },
                    ],
                    selectedKeys: [String(pageSize)],
                    onClick: ({ key }) => {
                      const newSize = Number(key);
                      if (pagination && pagination.onChange) {
                        pagination.onChange(1, newSize);
                      }
                    },
                  }}
                  trigger={['click']}
                  placement="topRight"
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/35 text-white font-bold text-[10px] rounded px-1.5 h-[20px] outline-none cursor-pointer transition-all leading-none"
                    title="Change page size"
                  >
                    <span>{pageSize}</span>
                    <DownOutlined className="text-[7px] text-white/85" />
                  </button>
                </Dropdown>
              </div>

              <span className="text-[10px] text-white/95 font-medium whitespace-nowrap leading-none">
                {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={handlePrevPage}
                  title="Previous page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <LeftOutlined className="text-[8px]" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={handleNextPage}
                  title="Next page"
                  className="w-5 h-5 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 active:bg-white/30 disabled:opacity-30 disabled:hover:bg-white/15 disabled:cursor-not-allowed text-white transition-all cursor-pointer border border-white/20"
                >
                  <RightOutlined className="text-[8px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AppTable;
