import React from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';

export interface AppTableProps<T = any> extends AntTableProps<T> {
  className?: string;
}

export function AppTable<T extends object = any>({
  className = '',
  pagination = { pageSize: 10 },
  ...props
}: AppTableProps<T>) {
  return (
    <div className={`app-table-wrapper overflow-x-auto ${className}`}>
      <AntTable<T>
        pagination={pagination}
        className="bg-white rounded-xl overflow-hidden"
        {...props}
      />
    </div>
  );
}

export default AppTable;
