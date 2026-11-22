import React from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  extra?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  extra,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 mb-4 font-['Poppins','Inter',sans-serif] ${className}`}>
      <div className="space-y-0.5">
        {breadcrumbs && (
          <Breadcrumb
            className="text-[11px] mb-0.5 text-slate-400 border-0 [&_*]:border-0"
            items={breadcrumbs.map((b) => ({
              title: b.path ? <Link to={b.path} className="text-slate-400 hover:text-[#0096C7] border-0">{b.label}</Link> : b.label,
            }))}
          />
        )}
        <div className="flex items-center gap-2">
          {icon && <span className="text-base text-[#0096C7] border-0">{icon}</span>}
          <h1 className="text-[15px] sm:text-[16px] font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {extra && <div className="flex items-center gap-2.5 shrink-0">{extra}</div>}
    </div>
  );
};

export default PageHeader;
