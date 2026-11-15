import { ReviewItem } from '../../../types/ecommerce.types';

export interface ReviewManagementProps {
  onReviewSelect?: (review: ReviewItem) => void;
}

export interface ReviewFilterState {
  status: string;
  search: string;
}
