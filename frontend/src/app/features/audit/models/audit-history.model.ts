import { AuditAction, AuditLog } from './audit-log.model';

export const HISTORY_PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_HISTORY_PAGE_SIZE = 20;

export type HistoryEntityFilter =
  | 'ALL'
  | 'PROCESS'
  | 'PROCESS_STEP'
  | 'PROCESS_WORK_ELEMENT'
  | 'FUNCTION'
  | 'FAILURE_MODE'
  | 'FAILURE_EFFECT'
  | 'FAILURE_CAUSE'
  | 'RISK_ANALYSIS'
  | 'OPTIMIZATION'
  | 'OPTIMIZATION_ACTION'
  | 'CHANGE_REQUEST'
  | 'USER';

export type HistoryActionFilter = 'ALL' | AuditAction;

export interface AuditHistoryFilters {
  search?: string;
  entityType?: string;
  action?: AuditAction;
  userId?: string;
  from?: string;
  to?: string;
}

export interface AuditHistoryQuery extends AuditHistoryFilters {
  page: number;
  size: number;
}

export interface AuditHistoryPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface AuditStatistics {
  totalEvents: number;
  approved: number;
  rejected: number;
  pending: number;
}

export type HistoryResultStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

export interface HistoryEventView {
  id: string;
  log: AuditLog;
  entityType: string;
  entityLabel: string;
  iconKind: string;
  accent: number;
  action: AuditAction;
  actionLabel: string;
  headline: string;
  context: string;
  itemName: string | null;
  moduleItem: string;
  operationLabel: string;
  performedByName: string;
  resultLabel: string | null;
  resultStatus: HistoryResultStatus | null;
  dateLabel: string;
  timeLabel: string;
  datetimeLabel: string;
  createdAt: string;
}
