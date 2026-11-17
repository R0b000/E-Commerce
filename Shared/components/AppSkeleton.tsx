import React from 'react';

// ============================================================================
// Base Primitive Skeleton Box
// ============================================================================
export interface AppSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  variant?: 'rectangular' | 'circular' | 'text';
}

export const AppSkeleton: React.FC<AppSkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  variant = 'rectangular',
}) => {
  const roundedClass =
    variant === 'circular'
      ? 'rounded-full'
      : rounded === 'full'
      ? 'rounded-full'
      : rounded === 'sm'
      ? 'rounded'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === 'xl'
      ? 'rounded-xl'
      : rounded === '2xl'
      ? 'rounded-2xl'
      : rounded === 'none'
      ? 'rounded-none'
      : 'rounded-md';

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? height : undefined),
    height: height ?? (variant === 'text' ? '12px' : undefined),
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${roundedClass} ${className}`}
    />
  );
};

// ============================================================================
// Table Skeleton (renders multiple realistic <tr> rows for <tbody>)
// ============================================================================
export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  hasAvatar?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 6,
  rows = 5,
  hasAvatar = true,
}) => {
  const rowList = Array.from({ length: rows });

  // Realistic width variations for columns
  const widths = ['w-24', 'w-36', 'w-28', 'w-16', 'w-20', 'w-32', 'w-20'];

  return (
    <>
      {rowList.map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
          {Array.from({ length: columns }).map((__, colIndex) => {
            // First column: avatar + text or code pill
            if (colIndex === 0 && hasAvatar) {
              return (
                <td key={colIndex} className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <AppSkeleton variant="circular" width="32px" height="32px" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <AppSkeleton height="12px" className="w-28" />
                      <AppSkeleton height="9px" className="w-20" />
                    </div>
                  </div>
                </td>
              );
            }

            // Last column: action button skeletons
            if (colIndex === columns - 1) {
              return (
                <td key={colIndex} className="py-3.5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AppSkeleton height="26px" className="w-16" rounded="lg" />
                    <AppSkeleton height="26px" className="w-8" rounded="lg" />
                  </div>
                </td>
              );
            }

            // Middle columns: tags, currency, text
            const w = widths[(rowIndex + colIndex) % widths.length];
            return (
              <td key={colIndex} className="py-3.5 px-4">
                <AppSkeleton height="11px" className={w} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

// ============================================================================
// Card / Grid Skeleton (for Products, Categories, Reviews grid)
// ============================================================================
export interface CardSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4 | 5;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 6,
  columns = 3,
}) => {
  const cards = Array.from({ length: count });

  const gridCols =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4 sm:gap-6 w-full`}>
      {cards.map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
        >
          {/* Card Image Area */}
          <AppSkeleton height="160px" rounded="xl" className="w-full" />

          {/* Text & Meta */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <AppSkeleton height="10px" className="w-16" rounded="full" />
              <AppSkeleton height="10px" className="w-12" rounded="full" />
            </div>
            <AppSkeleton height="14px" className="w-3/4" />
            <AppSkeleton height="10px" className="w-full" />
          </div>

          {/* Bottom Price & Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <AppSkeleton height="18px" className="w-16" />
            <AppSkeleton height="32px" className="w-24" rounded="xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Dashboard Skeleton (KPI stats, charts, recent table)
// ============================================================================
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 w-full font-['Nunito_Sans','Poppins',sans-serif]">
      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <AppSkeleton height="12px" className="w-24" />
              <AppSkeleton variant="circular" width="28px" height="28px" />
            </div>
            <AppSkeleton height="28px" className="w-32" />
            <AppSkeleton height="10px" className="w-40" />
          </div>
        ))}
      </div>

      {/* Row 2: Chart Area & Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <AppSkeleton height="14px" className="w-36" />
              <AppSkeleton height="10px" className="w-48" />
            </div>
            <AppSkeleton height="20px" className="w-24" rounded="lg" />
          </div>
          <AppSkeleton height="240px" rounded="xl" className="w-full" />
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <AppSkeleton height="14px" className="w-32" />
          <AppSkeleton height="10px" className="w-48" />
          <AppSkeleton height="240px" rounded="xl" className="w-full" />
        </div>
      </div>

      {/* Row 3: Recent Activity Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <AppSkeleton height="14px" className="w-36" />
            <AppSkeleton height="10px" className="w-56" />
          </div>
          <AppSkeleton height="24px" className="w-20" rounded="lg" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <AppSkeleton variant="circular" width="32px" height="32px" />
                <div className="space-y-1.5">
                  <AppSkeleton height="12px" className="w-32" />
                  <AppSkeleton height="9px" className="w-24" />
                </div>
              </div>
              <AppSkeleton height="14px" className="w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Matrix / Permissions Skeleton
// ============================================================================
export const MatrixSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-3">
            <AppSkeleton height="14px" className="w-40" />
            <AppSkeleton height="10px" className="w-20" rounded="full" />
          </div>
          <div className="flex items-center gap-4">
            <AppSkeleton height="16px" className="w-16" rounded="sm" />
            <AppSkeleton height="16px" className="w-16" rounded="sm" />
            <AppSkeleton height="16px" className="w-16" rounded="sm" />
            <AppSkeleton height="16px" className="w-16" rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  );
};
