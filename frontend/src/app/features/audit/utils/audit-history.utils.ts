import { parseJsonObject } from '../../../shared/utils/json-data.utils';
import {
  AuditHistoryPage,
  AuditStatistics,
  HistoryActionFilter,
  HistoryEntityFilter,
  HistoryEventView
} from '../models/audit-history.model';
import { AuditAction, AuditLog } from '../models/audit-log.model';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const HISTORY_ENTITY_OPTIONS: readonly { value: HistoryEntityFilter; label: string }[] = [
  { value: 'ALL', label: 'All entities' },
  { value: 'PROCESS', label: 'Process' },
  { value: 'PROCESS_STEP', label: 'Process Step' },
  { value: 'PROCESS_WORK_ELEMENT', label: 'Work Element' },
  { value: 'FUNCTION', label: 'Function' },
  { value: 'FAILURE_MODE', label: 'Failure Mode' },
  { value: 'FAILURE_EFFECT', label: 'Failure Effect' },
  { value: 'FAILURE_CAUSE', label: 'Failure Cause' },
  { value: 'RISK_ANALYSIS', label: 'Risk Analysis' },
  { value: 'OPTIMIZATION', label: 'Optimization' },
  { value: 'OPTIMIZATION_ACTION', label: 'Optimization Action' },
  { value: 'CHANGE_REQUEST', label: 'Change Request' },
  { value: 'USER', label: 'User' }
];

export const HISTORY_ACTION_OPTIONS: readonly { value: HistoryActionFilter; label: string }[] = [
  { value: 'ALL', label: 'All actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'ENABLE', label: 'Enable' },
  { value: 'DISABLE', label: 'Disable' },
  { value: 'APPROVE', label: 'Approved' },
  { value: 'REJECT', label: 'Rejected' }
];

export function isHistoryEntityFilter(value: string): value is HistoryEntityFilter {
  return HISTORY_ENTITY_OPTIONS.some(option => option.value === value);
}

export function isHistoryActionFilter(value: string): value is HistoryActionFilter {
  return HISTORY_ACTION_OPTIONS.some(option => option.value === value);
}

export function toHistoryEventView(log: AuditLog): HistoryEventView {
  const entityType = normalizeEntityType(log.entityType);
  const entityLabel = entityTypeLabel(entityType);
  const result = eventResult(log, entityType);
  const payloadOperation = extractPayloadOperation(log);
  const operationLabel = payloadOperation ?? historyActionLabel(log.action);
  const itemName = extractItemName(log);
  const performedByName = displayPersonName(log.performedByName);
  const headline = eventHeadline(entityLabel, log.action);

  return {
    id: log.id,
    log,
    entityType,
    entityLabel,
    iconKind: entityIconKind(entityType),
    accent: entityAccent(entityType),
    action: log.action,
    actionLabel: historyActionLabel(log.action),
    headline,
    context: eventContext(entityType, entityLabel, log.action, payloadOperation, itemName),
    itemName,
    moduleItem: itemName ? `${entityLabel} / ${itemName}` : entityLabel,
    operationLabel,
    performedByName,
    resultLabel: result?.label ?? null,
    resultStatus: result?.status ?? null,
    dateLabel: formatHistoryDate(log.createdAt),
    timeLabel: formatHistoryTime(log.createdAt),
    datetimeLabel: formatHistoryDateTime(log.createdAt),
    createdAt: log.createdAt
  };
}

export function readHistoryPage(value: AuditHistoryPage | null | undefined): AuditHistoryPage {
  const content = Array.isArray(value?.content) ? value.content : [];

  return {
    content,
    size: finiteNumber(value?.size, 20),
    number: finiteNumber(value?.number, 0),
    totalElements: finiteNumber(value?.totalElements, 0),
    totalPages: finiteNumber(value?.totalPages, 0),
    first: value?.first,
    last: value?.last,
    empty: value?.empty
  };
}

export function readAuditStatistics(value: AuditStatistics | null | undefined): AuditStatistics {
  return {
    totalEvents: finiteNumber(value?.totalEvents, 0),
    approved: finiteNumber(value?.approved, 0),
    rejected: finiteNumber(value?.rejected, 0),
    pending: finiteNumber(value?.pending, 0)
  };
}

export function readHistoryDateParam(value: string | null | undefined): string {
  return toDayKey(value ?? '') ?? '';
}

export function toApiDateTimeStart(value: string | null | undefined): string | undefined {
  const day = readHistoryDateParam(value);
  return day.length > 0 ? `${day}T00:00:00` : undefined;
}

export function toApiDateTimeEnd(value: string | null | undefined): string | undefined {
  const day = readHistoryDateParam(value);
  return day.length > 0 ? `${day}T23:59:59` : undefined;
}

export function entityTypeLabel(entityType: string): string {
  const normalized = normalizeEntityType(entityType);
  const match = HISTORY_ENTITY_OPTIONS.find(option => option.value === normalized);

  if (match && match.value !== 'ALL') {
    return match.label;
  }

  if (normalized === 'WORK_ELEMENT') {
    return 'Work Element';
  }

  if (normalized === 'ACTION') {
    return 'Action';
  }

  const readable = normalized.replaceAll('_', ' ').toLowerCase();
  return readable.length === 0 ? entityType : readable.charAt(0).toUpperCase() + readable.slice(1);
}

export function historyActionLabel(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
      return 'Create';
    case 'UPDATE':
      return 'Update';
    case 'DELETE':
      return 'Delete';
    case 'ENABLE':
      return 'Enable';
    case 'DISABLE':
      return 'Disable';
    case 'APPROVE':
      return 'Approved';
    case 'REJECT':
      return 'Rejected';
  }
}

export function displayPersonName(value: string | null | undefined): string {
  const name = value?.trim();

  if (!name || looksLikeUuid(name)) {
    return '—';
  }

  return name;
}

export function formatHistoryDate(value: string): string {
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

export function formatHistoryTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatHistoryDateTime(value: string): string {
  const date = formatHistoryDate(value);
  const time = formatHistoryTime(value);
  return time ? `${date}, ${time}` : date;
}

export function matchesHistorySearch(item: HistoryEventView, query: string): boolean {
  if (query.length === 0) {
    return true;
  }

  const haystack = [
    item.entityLabel,
    item.entityType,
    item.actionLabel,
    item.action,
    item.headline,
    item.context,
    item.itemName ?? '',
    item.moduleItem,
    item.operationLabel,
    item.resultLabel ?? '',
    item.performedByName,
    item.dateLabel,
    item.datetimeLabel
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export function matchesHistoryDateRange(item: HistoryEventView, fromDate: string, toDate: string): boolean {
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

export function visiblePageIndexes(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(current - 3, total - 7));
  return Array.from({ length: 7 }, (_, index) => start + index);
}

function eventHeadline(entityLabel: string, action: AuditAction): string {
  return `${entityLabel} ${actionPastTense(action)}`;
}

function eventContext(
  entityType: string,
  entityLabel: string,
  action: AuditAction,
  payloadOperation: string | null,
  itemName: string | null
): string {
  if (entityType === 'CHANGE_REQUEST') {
    if (payloadOperation === 'Update') {
      return 'Request to update an existing record';
    }

    if (payloadOperation === 'Create') {
      return 'Request to create a new record';
    }

    if (action === 'APPROVE') {
      return 'The submitted change was approved';
    }

    if (action === 'REJECT') {
      return 'The submitted change was rejected';
    }
  }

  if (action === 'UPDATE') {
    return itemName
      ? `${entityLabel} information was modified`
      : `${entityLabel} information was modified`;
  }

  if (action === 'CREATE') {
    return `A new ${entityLabel.toLowerCase()} was created`;
  }

  if (action === 'DELETE') {
    return `${entityLabel} was removed`;
  }

  if (action === 'ENABLE') {
    return `${entityLabel} was enabled`;
  }

  if (action === 'DISABLE') {
    return `${entityLabel} was disabled`;
  }

  return eventHeadline(entityLabel, action);
}

function eventResult(
  log: AuditLog,
  entityType: string
): { status: 'APPROVED' | 'REJECTED' | 'PENDING'; label: string } | null {
  if (log.action === 'APPROVE') {
    return { status: 'APPROVED', label: 'Approved' };
  }

  if (log.action === 'REJECT') {
    return { status: 'REJECTED', label: 'Rejected' };
  }

  if (entityType === 'CHANGE_REQUEST' && log.action === 'CREATE') {
    return { status: 'PENDING', label: 'Pending' };
  }

  return null;
}

function extractPayloadOperation(log: AuditLog): string | null {
  const payload = parseJsonObject(log.newData) ?? parseJsonObject(log.oldData);
  const value = payload?.['operation'];

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === 'CREATE') {
    return 'Create';
  }

  if (normalized === 'UPDATE') {
    return 'Update';
  }

  if (normalized === 'DELETE') {
    return 'Delete';
  }

  return null;
}

function actionPastTense(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
      return 'created';
    case 'UPDATE':
      return 'updated';
    case 'DELETE':
      return 'deleted';
    case 'ENABLE':
      return 'enabled';
    case 'DISABLE':
      return 'disabled';
    case 'APPROVE':
      return 'approved';
    case 'REJECT':
      return 'rejected';
  }
}

function extractItemName(log: AuditLog): string | null {
  const payload = parseJsonObject(log.newData) ?? parseJsonObject(log.oldData);

  if (!payload) {
    return null;
  }

  const name = readBusinessString(payload, 'name');
  if (name) {
    return name;
  }

  const processName = readBusinessString(payload, 'processName');
  if (processName) {
    return processName;
  }

  const title = readBusinessString(payload, 'title');
  if (title) {
    return title;
  }

  const email = readBusinessString(payload, 'email');
  if (email) {
    return email;
  }

  const firstName = readBusinessString(payload, 'firstName');
  const lastName = readBusinessString(payload, 'lastName');
  const fullName = [firstName, lastName].filter(part => part !== null).join(' ').trim();
  if (fullName.length > 0 && !looksLikeUuid(fullName)) {
    return fullName;
  }

  const processNumber = readBusinessString(payload, 'processNumber');
  if (processNumber) {
    return processNumber;
  }

  return null;
}

function readBusinessString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];

  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  return text.length > 0 && !looksLikeUuid(text) ? text : null;
}

function entityIconKind(entityType: string): string {
  const value = normalizeEntityType(entityType);

  if (value === 'WORK_ELEMENT') {
    return 'PROCESS_WORK_ELEMENT';
  }

  if (value === 'ACTION') {
    return 'OPTIMIZATION_ACTION';
  }

  return value;
}

function entityAccent(entityType: string): number {
  const value = normalizeEntityType(entityType);
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index)) % 5;
  }

  return hash;
}

function normalizeEntityType(entityType: string): string {
  return entityType.trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
}

function looksLikeUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
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

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
