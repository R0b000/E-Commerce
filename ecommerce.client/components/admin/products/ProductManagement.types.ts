import { Product, Category } from '../../../types/ecommerce.types';

export interface ProductManagementProps {
  initialCategory?: string;
  className?: string;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
  status: 'active' | 'draft' | 'archived';
}

export interface ProductFilterState {
  search: string;
  category: string;
  status: string;
}
