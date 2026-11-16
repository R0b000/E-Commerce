import React from 'react';
import './Skeleton.css';
import { SkeletonProps } from './Skeleton.types';

export const Skeleton: React.FC<SkeletonProps & { className?: string; width?: string | number; height?: string | number }> = ({
  className = '',
  width,
  height,
}) => {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
    />
  );
};

export default Skeleton;
