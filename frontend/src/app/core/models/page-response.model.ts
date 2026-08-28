export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}
