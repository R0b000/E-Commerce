import { MenuItem } from '../../../types/ecommerce.types';

export interface AdminLayoutProps {
  children?: React.ReactNode;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'customer' | 'stock';
  read: boolean;
}
