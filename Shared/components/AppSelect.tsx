import React from 'react';
import { AutoCompleteSelect } from '../UI/components/AutoCompleteSelect/AutoCompleteSelect';
import {
  AutoCompleteSelectOption,
  AutoCompleteSelectProps,
} from '../UI/components/AutoCompleteSelect/AutoCompleteSelect.types';

export type AppSelectOption = AutoCompleteSelectOption;
export interface AppSelectProps extends AutoCompleteSelectProps {
  error?: string;
  status?: 'error' | 'warning';
  showSearch?: boolean;
}

export const AppSelect: React.FC<AppSelectProps> = ({
  error,
  status,
  showSearch,
  theme = 'amber',
  style,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`space-y-1 ${style?.width ? 'shrink-0' : 'w-full'} ${className}`}
      style={style}
    >
      <AutoCompleteSelect theme={theme} {...props} />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export default AppSelect;
