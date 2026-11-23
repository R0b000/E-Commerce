export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  tag: string;
  description?: string;
  logo?: string;
  website?: string;
  productCount: number;
  categories: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface BrandManagementProps {
  onBrandSelect?: (brand: BrandItem) => void;
}
