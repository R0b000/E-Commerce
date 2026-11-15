import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

export interface AppButtonProps extends AntButtonProps {
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  type = 'default',
  size = 'middle',
  className = '',
  ...props
}) => {
  return (
    <AntButton
      type={type}
      size={size}
      className={`font-medium rounded-lg transition-all ${className}`}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default AppButton;
