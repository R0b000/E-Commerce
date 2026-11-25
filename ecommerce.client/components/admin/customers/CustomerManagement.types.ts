import { Customer } from '../../../types/ecommerce.types';

export interface CustomerManagementProps {
  mode?: 'all' | 'employee' | 'client';
  onCustomerSelect?: (customer: Customer) => void;
}

export interface CustomerFilterState {
  search: string;
  roleFilter: string;
}
