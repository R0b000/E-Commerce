import { Category } from '../../../types/ecommerce.types';

export interface CategoryManagementProps {
  onCategorySelect?: (category: Category) => void;
}

export interface CategoryFormData {
  name: string;
  description: string;
  image?: string;
  isActive: boolean;
}
