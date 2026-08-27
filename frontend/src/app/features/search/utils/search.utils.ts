import { HttpErrorResponse } from '@angular/common/http';
import { SEARCH_ENTITY_TYPES, SearchEntityType } from '../models/search-entity-type.model';
import { SearchResponse } from '../models/search-response.model';
import { SearchResult } from '../models/search-result.model';

export interface SearchEntityOption {
  value: SearchEntityType | '';
  label: string;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

export interface PageToken {
  kind: 'page' | 'ellipsis';
  page?: number;
}

export const SEARCH_ENTITY_OPTIONS: readonly SearchEntityOption[] = [
  { value: '', label: 'All Types' },
  { value: 'PROCESS', label: 'Process' },
  { value: 'PROCESS_STEP', label: 'Process Step' },
  { value: 'WORK_ELEMENT', label: 'Work Element' },
  { value: 'FUNCTION', label: 'Function' },
  { value: 'FAILURE_MODE', label: 'Failure Mode' },
  { value: 'FAILURE_EFFECT', label: 'Failure Effect' },
  { value: 'FAILURE_CAUSE', label: 'Failure Cause' },
  { value: 'RISK_ANALYSIS', label: 'Risk Analysis' },
  { value: 'OPTIMIZATION', label: 'Optimization' },
  { value: 'OPTIMIZATION_ACTION', label: 'Optimization Action' }
];

export const SEARCH_PAGE_SIZES = [10, 20, 50] as const;

export const DEFAULT_SEARCH_PAGE_SIZE = 20;

const ENTITY_LABELS: Record<SearchEntityType, string> = {
  PROCESS: 'Process',
  PROCESS_STEP: 'Process Step',
  WORK_ELEMENT: 'Work Element',
  FUNCTION: 'Function',
  FAILURE_MODE: 'Failure Mode',
  FAILURE_EFFECT: 'Failure Effect',
  FAILURE_CAUSE: 'Failure Cause',
  RISK_ANALYSIS: 'Risk Analysis',
  OPTIMIZATION: 'Optimization',
  OPTIMIZATION_ACTION: 'Optimization Action'
};

export function entityTypeLabel(entityType: SearchEntityType): string {
  return ENTITY_LABELS[entityType];
}

export function formatStatus(status: string): string {
  const readable = status.replaceAll('_', ' ').trim().toLowerCase();

  if (readable.length === 0) {
    return status;
  }

  return readable.replace(/\b\w/g, char => char.toUpperCase());
}

export function formatPriority(priority: string): string {
  return priority.replaceAll('_', ' ').trim().toUpperCase();
}

export function highlightParts(source: string, query: string): HighlightPart[] {
  const trimmed = query.trim();

  if (trimmed.length === 0 || source.length === 0) {
    return [{ text: source, match: false }];
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escaped, 'gi');
  const parts: HighlightPart[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(matcher)) {
    const start = match.index ?? 0;
    const text = match[0];

    if (start > lastIndex) {
      parts.push({ text: source.slice(lastIndex, start), match: false });
    }

    parts.push({ text, match: true });
    lastIndex = start + text.length;
  }

  if (lastIndex < source.length) {
    parts.push({ text: source.slice(lastIndex), match: false });
  }

  return parts.length > 0 ? parts : [{ text: source, match: false }];
}

export function viewRouteForResult(result: SearchResult): string | null {
  if (result.entityType === 'PROCESS') {
    return `/processes/${result.id}`;
  }

  if (result.processId) {
    return `/processes/${result.processId}/workspace`;
  }

  return null;
}

export function paginationRange(current: number, total: number): PageToken[] {
  if (total <= 0) {
    return [];
  }

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => ({ kind: 'page', page: index }));
  }

  const tokens: PageToken[] = [{ kind: 'page', page: 0 }];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  if (start > 1) {
    tokens.push({ kind: 'ellipsis' });
  }

  for (let page = start; page <= end; page += 1) {
    tokens.push({ kind: 'page', page });
  }

  if (end < total - 2) {
    tokens.push({ kind: 'ellipsis' });
  }

  tokens.push({ kind: 'page', page: total - 1 });
  return tokens;
}

export function resolveSearchApiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to complete the search.';
    }

    if (error.status >= 500) {
      return 'Unable to complete the search.';
    }
  }

  return 'Unable to complete the search.';
}

export function isSearchResponse(value: unknown): value is SearchResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (!Array.isArray(value['content']) || !value['content'].every(isSearchResult)) {
    return false;
  }

  return (
    isFiniteNumber(value['page']) &&
    isFiniteNumber(value['size']) &&
    isFiniteNumber(value['totalElements']) &&
    isFiniteNumber(value['totalPages'])
  );
}

function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value['id']) &&
    isSearchEntityType(value['entityType']) &&
    typeof value['title'] === 'string' &&
    isNullableString(value['description']) &&
    isNullableString(value['reference']) &&
    isNullableString(value['processId']) &&
    isNullableString(value['processName']) &&
    isNullableString(value['processStepId']) &&
    isNullableString(value['processStepName']) &&
    isNullableString(value['status']) &&
    isNullableString(value['actionPriority'])
  );
}

function isSearchEntityType(value: unknown): value is SearchEntityType {
  return typeof value === 'string' && SEARCH_ENTITY_TYPES.includes(value as SearchEntityType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || value === undefined || typeof value === 'string';
}
