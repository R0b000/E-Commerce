import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

export interface AppCardProps extends AntCardProps {
  children?: React.ReactNode;
  className?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  title,
  extra,
  bordered = true,
  className = '',
  style,
  ...props
}) => {
  return (
    <AntCard
      title={title}
      extra={extra}
      bordered={bordered}
      className={`bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        ...style,
      }}
      headStyle={{
        borderBottom: '1px solid #f1f5f9',
        fontWeight: 600,
        color: '#1e293b',
        padding: '16px 20px',
      }}
      bodyStyle={{
        padding: '20px',
      }}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default AppCard;
