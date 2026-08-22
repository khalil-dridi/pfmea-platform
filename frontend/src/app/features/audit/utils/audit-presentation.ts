import { parseJsonObject } from '../../../shared/utils/json-data.utils';
import { AuditAction, AuditLog } from '../models/audit-log.model';
import {
  AuditActionFilter,
  AuditModuleFilter,
  AuditPresentationItem,
  AuditResultFilter,
  AuditResultStatus
} from '../models/audit-presentation.model';
import { formatAuditDateTime } from './audit.utils';

export const SUPER_ADMIN_ACTION_FILTERS: readonly { value: AuditActionFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CREATED', label: 'Created' },
  { value: 'UPDATED', label: 'Updated' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ENABLED', label: 'Enabled' },
  { value: 'DISABLED', label: 'Disabled' },
  { value: 'COMPLETED', label: 'Completed' }
];

export const ADMIN_ACTION_FILTERS: readonly { value: AuditActionFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CREATED', label: 'Created' },
  { value: 'UPDATED', label: 'Updated' }
];

export const MODULE_FILTERS: readonly { value: AuditModuleFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'USER', label: 'Users' },
  { value: 'PROCESS', label: 'Processes' },
  { value: 'PROCESS_STEP', label: 'Process Steps' },
  { value: 'WORK_ELEMENT', label: 'Work Elements' },
  { value: 'FUNCTION', label: 'Functions' },
  { value: 'FAILURE_MODE', label: 'Failure Modes' },
  { value: 'ACTION', label: 'Actions' },
  { value: 'CHANGE_REQUEST', label: 'Change Requests' }
];

export function toAuditPresentation(log: AuditLog): AuditPresentationItem {
  const entityType = normalizeEntityType(log.entityType);
  const moduleKey = toModuleKey(entityType, log.action);
  const payload = parseJsonObject(log.newData) ?? parseJsonObject(log.oldData);
  const hasPrevious = !isEmptyPayload(parseJsonObject(log.oldData));
  const itemLabel = extractItemLabel(payload, moduleKey, entityType);
  const operationLabel = resolveOperationLabel(log, hasPrevious);
  const status = resolveStatus(log, entityType);
  const resultLabel = resolveResultLabel(status, log.action);
  const whatHappened = resolveWhatHappened(log, entityType, moduleKey);
  const isReviewAction = log.action === 'APPROVE' || log.action === 'REJECT';

  return {
    id: log.id,
    createdAt: log.createdAt,
    dateLabel: formatAuditDate(log.createdAt),
    timeLabel: formatAuditTime(log.createdAt),
    datetimeLabel: formatAuditDateTime(log.createdAt),
    whatHappened,
    eventContext: resolveEventContext(log, entityType, operationLabel),
    whatYouDid: resolveWhatYouDid(log, entityType, whatHappened),
    typeLabel: resolveTypeLabel(moduleKey, entityType),
    itemLabel,
    itemDetail: resolveItemDetail(log, entityType, operationLabel),
    performedById: log.performedById,
    performedByName: log.performedByName,
    resultLabel,
    status,
    operationLabel,
    reviewedByName: isReviewAction ? log.performedByName : null,
    reviewedAtLabel: isReviewAction ? formatAuditDateTime(log.createdAt) : null,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    moduleKey
  };
}

export function matchesActionFilter(item: AuditPresentationItem, filter: AuditActionFilter): boolean {
  if (filter === 'ALL') {
    return true;
  }

  if (filter === 'CREATED') {
    return item.action === 'CREATE' && item.moduleKey !== 'CHANGE_REQUEST';
  }

  if (filter === 'UPDATED') {
    return item.action === 'UPDATE';
  }

  if (filter === 'SUBMITTED') {
    return item.action === 'CREATE' && item.moduleKey === 'CHANGE_REQUEST';
  }

  if (filter === 'APPROVED') {
    return item.action === 'APPROVE';
  }

  if (filter === 'REJECTED') {
    return item.action === 'REJECT';
  }

  if (filter === 'ENABLED') {
    return item.action === 'ENABLE';
  }

  if (filter === 'DISABLED') {
    return item.action === 'DISABLE';
  }

  return false;
}

export function matchesModuleFilter(item: AuditPresentationItem, filter: AuditModuleFilter): boolean {
  return filter === 'ALL' || item.moduleKey === filter;
}

export function matchesResultFilter(item: AuditPresentationItem, filter: AuditResultFilter): boolean {
  if (filter === 'ALL') {
    return true;
  }

  if (filter === 'SUCCESSFUL') {
    return item.status === 'SUCCESS';
  }

  if (filter === 'REJECTED') {
    return item.status === 'REJECTED';
  }

  return item.status === 'PENDING';
}

export function matchesPerformedBy(item: AuditPresentationItem, performedById: string): boolean {
  return performedById === 'ALL' || item.performedById === performedById;
}

export function matchesDateRange(
  item: AuditPresentationItem,
  fromDate: string,
  toDate: string
): boolean {
  const day = toDayKey(item.createdAt);

  if (!day) {
    return fromDate.length === 0 && toDate.length === 0;
  }

  if (fromDate.length > 0 && day < fromDate) {
    return false;
  }

  if (toDate.length > 0 && day > toDate) {
    return false;
  }

  return true;
}

export function matchesSearch(item: AuditPresentationItem, query: string): boolean {
  if (query.length === 0) {
    return true;
  }

  const haystack = [
    item.whatHappened,
    item.whatYouDid,
    item.eventContext ?? '',
    item.typeLabel,
    item.itemLabel,
    item.itemDetail ?? '',
    item.performedByName,
    item.resultLabel,
    item.operationLabel,
    item.reviewedByName ?? ''
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export function resultBadgeClass(status: AuditResultStatus): string {
  if (status === 'SUCCESS') {
    return 'badge badge--success';
  }

  if (status === 'REJECTED') {
    return 'badge badge--danger';
  }

  if (status === 'PENDING') {
    return 'badge badge--pending';
  }

  return 'badge badge--primary';
}

function resolveWhatHappened(log: AuditLog, entityType: string, moduleKey: AuditModuleFilter): string {
  if (moduleKey === 'CHANGE_REQUEST' && log.action === 'CREATE') {
    return 'Change request submitted';
  }

  if (log.action === 'APPROVE') {
    return 'Change request approved';
  }

  if (log.action === 'REJECT') {
    return 'Change request rejected';
  }

  if (entityType === 'USER' && log.action === 'ENABLE') {
    return 'User enabled';
  }

  if (entityType === 'USER' && log.action === 'DISABLE') {
    return 'User disabled';
  }

  if (entityType === 'PROCESS' && log.action === 'CREATE') {
    return 'Process created';
  }

  if (entityType === 'PROCESS' && log.action === 'UPDATE') {
    return 'Process updated';
  }

  const moduleLabel = resolveTypeLabel(moduleKey, entityType);

  switch (log.action) {
    case 'CREATE':
      return `${moduleLabel} created`;
    case 'UPDATE':
      return `${moduleLabel} updated`;
    case 'DELETE':
      return `${moduleLabel} deleted`;
    case 'ENABLE':
      return `${moduleLabel} enabled`;
    case 'DISABLE':
      return `${moduleLabel} disabled`;
    default:
      return `${moduleLabel} updated`;
  }
}

function resolveWhatYouDid(log: AuditLog, entityType: string, fallback: string): string {
  if (entityType === 'CHANGE_REQUEST' && log.action === 'CREATE') {
    return 'Submitted a change request';
  }

  if (log.action === 'CREATE') {
    return `Created ${resolveTypeLabel(toModuleKey(entityType, log.action), entityType).toLowerCase()}`;
  }

  if (log.action === 'UPDATE') {
    return `Updated ${resolveTypeLabel(toModuleKey(entityType, log.action), entityType).toLowerCase()}`;
  }

  return fallback;
}

function resolveEventContext(log: AuditLog, entityType: string, operationLabel: string): string | null {
  if (entityType === 'CHANGE_REQUEST' || log.action === 'APPROVE' || log.action === 'REJECT') {
    return operationLabel === 'Update'
      ? 'Request to update a process'
      : 'Request to create a new process';
  }

  return null;
}

function resolveTypeLabel(moduleKey: AuditModuleFilter, entityType: string): string {
  if (moduleKey === 'ALL') {
    return humanizeEntityType(entityType);
  }

  switch (moduleKey) {
    case 'USER':
      return 'User';
    case 'PROCESS':
      return 'Process';
    case 'PROCESS_STEP':
      return 'Process Step';
    case 'WORK_ELEMENT':
      return 'Work Element';
    case 'FUNCTION':
      return 'Function';
    case 'FAILURE_MODE':
      return 'Failure Mode';
    case 'ACTION':
      return 'Action';
    case 'CHANGE_REQUEST':
      return 'Change Request';
    default:
      return humanizeEntityType(entityType);
  }
}

function resolveItemDetail(log: AuditLog, entityType: string, operationLabel: string): string | null {
  if (entityType === 'CHANGE_REQUEST' || log.action === 'APPROVE' || log.action === 'REJECT') {
    return `${operationLabel} Process`;
  }

  return null;
}

function resolveOperationLabel(log: AuditLog, hasPrevious: boolean): string {
  if (log.action === 'UPDATE' || hasPrevious) {
    return 'Update';
  }

  return 'Create';
}

function resolveStatus(log: AuditLog, entityType: string): AuditResultStatus {
  if (log.action === 'REJECT') {
    return 'REJECTED';
  }

  if (entityType === 'CHANGE_REQUEST' && log.action === 'CREATE') {
    return 'PENDING';
  }

  return 'SUCCESS';
}

function resolveResultLabel(status: AuditResultStatus, action: AuditAction): string {
  if (status === 'PENDING') {
    return 'Pending';
  }

  if (status === 'REJECTED') {
    return 'Rejected';
  }

  if (action === 'APPROVE') {
    return 'Approved';
  }

  return 'Successful';
}

function toModuleKey(entityType: string, action: AuditAction): AuditModuleFilter {
  if (action === 'APPROVE') {
    return 'CHANGE_REQUEST';
  }

  if (entityType === 'USER') {
    return 'USER';
  }

  if (entityType === 'PROCESS') {
    return 'PROCESS';
  }

  if (entityType === 'PROCESS_STEP') {
    return 'PROCESS_STEP';
  }

  if (entityType === 'WORK_ELEMENT') {
    return 'WORK_ELEMENT';
  }

  if (entityType === 'FUNCTION') {
    return 'FUNCTION';
  }

  if (entityType === 'FAILURE_MODE') {
    return 'FAILURE_MODE';
  }

  if (entityType === 'ACTION') {
    return 'ACTION';
  }

  if (entityType === 'CHANGE_REQUEST') {
    return 'CHANGE_REQUEST';
  }

  return 'ALL';
}

function extractItemLabel(
  payload: ReturnType<typeof parseJsonObject>,
  moduleKey: AuditModuleFilter,
  entityType: string
): string {
  const name = readString(payload, 'name');
  if (name && !looksLikeUuid(name)) {
    return name;
  }

  const email = readString(payload, 'email');
  if (email && !looksLikeUuid(email)) {
    return email;
  }

  const title = readString(payload, 'title');
  if (title && !looksLikeUuid(title)) {
    return title;
  }

  const firstName = readString(payload, 'firstName');
  const lastName = readString(payload, 'lastName');
  const fullName = [firstName, lastName].filter(part => part !== null).join(' ').trim();
  if (fullName.length > 0 && !looksLikeUuid(fullName)) {
    return fullName;
  }

  const processNumber = readString(payload, 'processNumber');
  if (processNumber && !looksLikeUuid(processNumber)) {
    return processNumber;
  }

  return resolveTypeLabel(moduleKey, entityType);
}

function readString(payload: ReturnType<typeof parseJsonObject>, key: string): string | null {
  if (!payload) {
    return null;
  }

  const value = payload[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isEmptyPayload(payload: ReturnType<typeof parseJsonObject>): boolean {
  return payload === null || Object.keys(payload).length === 0;
}

function normalizeEntityType(entityType: string): string {
  return entityType.trim().toUpperCase().replaceAll(' ', '_');
}

function humanizeEntityType(entityType: string): string {
  const normalized = entityType.replaceAll('_', ' ').toLowerCase();
  return normalized.replace(/^[a-z]/, character => character.toUpperCase());
}

function formatAuditDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function formatAuditTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toDayKey(value: string): string | null {
  const isoDay = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());

  if (isoDay) {
    return isoDay[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
