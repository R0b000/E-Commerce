import { Customer } from '../../../types/ecommerce.types';

export interface CustomerManagementProps {
  onCustomerSelect?: (customer: Customer) => void;
}

export interface CustomerFilterState {
  search: string;
  roleFilter: string;
}
