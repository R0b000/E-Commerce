import React from 'react';
import { Tag } from 'antd';

export type StatusType =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'active'
  | 'draft'
  | 'archived'
  | 'paid'
  | 'failed'
  | 'refunded'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toLowerCase();

  let color = 'default';
  if (['delivered', 'active', 'paid'].includes(normalized)) {
    color = 'success';
  } else if (['processing', 'shipped'].includes(normalized)) {
    color = 'processing';
  } else if (['pending'].includes(normalized)) {
    color = 'warning';
  } else if (['cancelled', 'failed', 'archived'].includes(normalized)) {
    color = 'error';
  }

  return (
    <Tag
      color={color}
      className={`capitalize font-semibold text-[11px] px-2.5 py-0.5 rounded-full ${className}`}
    >
      {normalized}
    </Tag>
  );
};

export default StatusBadge;
