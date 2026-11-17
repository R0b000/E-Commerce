import React from 'react';

export interface AutoCompleteSelectOption {
  value: any;
  label: React.ReactNode;
  disabled?: boolean;
  [key: string]: any;
}

export interface AutoCompleteSelectProps {
  options: AutoCompleteSelectOption[];
  value?: any;
  defaultValue?: any;
  onChange?: (value: any, option?: AutoCompleteSelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  showLabel?: boolean;
  allowClear?: boolean;
  theme?: 'amber' | 'cyan';
}
