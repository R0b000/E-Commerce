import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

export interface AppButtonProps extends AntButtonProps {
  className?: string;
}

export const AppButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, AppButtonProps>(
  ({
    children,
    type = 'default',
    size = 'middle',
    className = '',
    ...props
  }, ref) => {
    return (
      <AntButton
        ref={ref}
        type={type}
        size={size}
        className={`font-medium rounded-lg transition-all ${className}`}
        {...props}
      >
        {children}
      </AntButton>
    );
  }
);

AppButton.displayName = 'AppButton';

export default AppButton;
