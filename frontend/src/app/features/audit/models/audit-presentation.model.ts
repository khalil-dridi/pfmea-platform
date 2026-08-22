import { AuditAction } from './audit-log.model';

export type AuditResultStatus = 'SUCCESS' | 'PENDING' | 'REJECTED' | 'NEUTRAL';

export type AuditActionFilter =
  | 'ALL'
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ENABLED'
  | 'DISABLED'
  | 'COMPLETED';

export type AuditModuleFilter =
  | 'ALL'
  | 'USER'
  | 'PROCESS'
  | 'PROCESS_STEP'
  | 'WORK_ELEMENT'
  | 'FUNCTION'
  | 'FAILURE_MODE'
  | 'ACTION'
  | 'CHANGE_REQUEST';

export type AuditResultFilter = 'ALL' | 'SUCCESSFUL' | 'REJECTED' | 'PENDING';

export interface AuditPresentationItem {
  id: string;
  createdAt: string;
  dateLabel: string;
  timeLabel: string;
  datetimeLabel: string;
  whatHappened: string;
  eventContext: string | null;
  whatYouDid: string;
  typeLabel: string;
  itemLabel: string;
  itemDetail: string | null;
  performedById: string;
  performedByName: string;
  resultLabel: string;
  status: AuditResultStatus;
  operationLabel: string;
  reviewedByName: string | null;
  reviewedAtLabel: string | null;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  moduleKey: AuditModuleFilter;
}
