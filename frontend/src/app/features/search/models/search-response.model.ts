import { SearchResult } from './search-result.model';

export interface SearchResponse {
  content: SearchResult[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
