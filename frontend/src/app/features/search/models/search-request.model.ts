import { SearchEntityType } from './search-entity-type.model';

export interface SearchRequest {
  q?: string;
  entityType?: SearchEntityType;
  processId?: string;
  processStepId?: string;
  page: number;
  size: number;
}
