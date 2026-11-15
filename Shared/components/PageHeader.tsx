import React from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  extra?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  extra,
  icon,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
      <div className="space-y-1">
        {breadcrumbs && (
          <Breadcrumb
            className="text-xs mb-1 text-slate-500"
            items={breadcrumbs.map((b) => ({
              title: b.path ? <Link to={b.path} className="text-slate-500 hover:text-[#0096C7]">{b.label}</Link> : b.label,
            }))}
          />
        )}
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-xl text-[#0096C7]">{icon}</span>}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            {description}
          </p>
        )}
      </div>

      {extra && <div className="flex items-center gap-3 shrink-0">{extra}</div>}
    </div>
  );
};

export default PageHeader;
