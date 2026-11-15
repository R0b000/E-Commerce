import React from 'react';
import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';

export interface AppSelectProps extends Omit<AntSelectProps, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (value: any, option?: any) => void;
}

export const AppSelect: React.FC<AppSelectProps> = ({
  label,
  error,
  className = '',
  onChange,
  ...props
}) => {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <AntSelect
        status={error ? 'error' : undefined}
        onChange={onChange}
        className={`w-full ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export default AppSelect;
