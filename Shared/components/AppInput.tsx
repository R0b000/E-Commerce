import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

export interface AppInputProps extends Omit<AntInputProps, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AppInput: React.FC<AppInputProps> = ({
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
      <AntInput
        status={error ? 'error' : undefined}
        onChange={onChange}
        className={`rounded-lg py-2 px-3 border-slate-300 focus:border-[#0096C7] ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export const AppSearchInput: React.FC<React.ComponentProps<typeof AntInput.Search>> = (props) => {
  return (
    <AntInput.Search
      className="app-search-input"
      enterButton
      {...props}
    />
  );
};

export default AppInput;
