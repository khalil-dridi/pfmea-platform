import { SearchEntityType } from './search-entity-type.model';

export interface SearchResult {
  id: string;
  entityType: SearchEntityType;
  title: string;
  description: string | null;
  reference: string | null;
  processId: string | null;
  processName: string | null;
  processStepId: string | null;
  processStepName: string | null;
  status: string | null;
  actionPriority: string | null;
}
