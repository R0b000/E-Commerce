import React from 'react';
import { Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  isPositive?: boolean;
  subtitle?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBg = '#eff6ff',
  iconColor = '#0096C7',
  trend,
  isPositive = true,
  subtitle,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow ${className}`}
      style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <Tag
              color={isPositive ? 'success' : 'error'}
              className="m-0 font-medium px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1 border-0"
            >
              {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{trend}</span>
            </Tag>
          )}
          {subtitle && <span className="text-slate-500 text-xs">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
