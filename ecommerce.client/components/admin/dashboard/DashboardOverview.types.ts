import { DashboardMetrics } from '../../../types/ecommerce.types';

export interface DashboardOverviewProps {
  onRefresh?: () => void;
  className?: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  colorScheme?: 'orange' | 'blue' | 'emerald' | 'amber';
}

export interface PerformanceChartProps {
  data: any[];
  title: string;
  description?: string;
}
