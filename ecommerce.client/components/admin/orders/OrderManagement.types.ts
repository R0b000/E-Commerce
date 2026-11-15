import { Order } from '../../../types/ecommerce.types';

export interface OrderManagementProps {
  initialStatus?: string;
  className?: string;
}

export interface OrderFilterState {
  status: string;
  search: string;
}
