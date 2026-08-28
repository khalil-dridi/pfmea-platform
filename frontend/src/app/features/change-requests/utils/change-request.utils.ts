import { HttpErrorResponse } from '@angular/common/http';
import { PageResponse } from '../../../core/models/page-response.model';
import { parseJsonObject } from '../../../shared/utils/json-data.utils';
import { ChangeRequest, ChangeRequestOperation, ChangeRequestStatus } from '../models/change-request.model';

export function statusLabel(status: ChangeRequestStatus): string {
  if (status === 'PENDING') {
    return 'Pending';
  }

  if (status === 'APPROVED') {
    return 'Approved';
  }

  return 'Rejected';
}

export function operationLabel(operation: ChangeRequestOperation): string {
  return operation === 'CREATE' ? 'Create' : 'Update';
}

export function entityTypeLabel(entityType: string): string {
  const normalized = entityType.trim().toUpperCase();

  if (normalized === 'PROCESS') {
    return 'Process';
  }

  if (normalized === 'USER') {
    return 'User';
  }

  if (normalized === 'CHANGE_REQUEST') {
    return 'Change Request';
  }

  if (normalized === 'PROCESS_STEP') {
    return 'Process Step';
  }

  if (normalized === 'WORK_ELEMENT') {
    return 'Work Element';
  }

  if (normalized === 'FUNCTION') {
    return 'Function';
  }

  if (normalized === 'FAILURE_MODE') {
    return 'Failure Mode';
  }

  if (normalized === 'ACTION') {
    return 'Action';
  }

  const readable = entityType.replaceAll('_', ' ').toLowerCase();
  return readable.length === 0 ? entityType : readable.charAt(0).toUpperCase() + readable.slice(1);
}

export function entityDisplayName(request: ChangeRequest): string | null {
  const payload = parseJsonObject(request.newData) ?? parseJsonObject(request.oldData);

  if (!payload) {
    return null;
  }

  const name = readPayloadString(payload, 'name');
  if (name) {
    return name;
  }

  const processNumber = readPayloadString(payload, 'processNumber');
  if (processNumber) {
    return processNumber;
  }

  return null;
}

export function isCreatedAtInRange(createdAt: string, fromDate: string, toDate: string): boolean {
  if (fromDate.length === 0 && toDate.length === 0) {
    return true;
  }

  const day = toCalendarDay(createdAt);

  if (!day) {
    return false;
  }

  if (fromDate.length > 0 && day < fromDate) {
    return false;
  }

  if (toDate.length > 0 && day > toDate) {
    return false;
  }

  return true;
}

function toCalendarDay(value: string): string | null {
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

function readPayloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function formatRequestDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatRequestListDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return `${day} at ${time}`;
}

export function readRequestDateParam(value: string | null | undefined): string {
  return toCalendarDay(value ?? '') ?? '';
}

export function toApiDateTimeStart(value: string | null | undefined): string | undefined {
  const day = readRequestDateParam(value);
  return day.length > 0 ? `${day}T00:00:00` : undefined;
}

export function toApiDateTimeEnd(value: string | null | undefined): string | undefined {
  const day = readRequestDateParam(value);
  return day.length > 0 ? `${day}T23:59:59` : undefined;
}

export function readChangeRequestPage(value: unknown): PageResponse<ChangeRequest> {
  const record = isRecord(value) ? value : {};
  const rawContent = record['content'];
  const content = Array.isArray(rawContent) ? (rawContent as ChangeRequest[]) : [];
  const number = finiteNumber(record['number'], 0);
  const size = finiteNumber(record['size'], 10);
  const totalPages = finiteNumber(record['totalPages'], 0);

  return {
    content,
    number,
    size,
    numberOfElements: finiteNumber(record['numberOfElements'], content.length),
    totalElements: finiteNumber(record['totalElements'], 0),
    totalPages,
    first: typeof record['first'] === 'boolean' ? record['first'] : number <= 0,
    last: typeof record['last'] === 'boolean' ? record['last'] : totalPages === 0 || number >= totalPages - 1
  };
}

export function visibleRequestPageIndexes(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(current - 3, total - 7));
  return Array.from({ length: 7 }, (_, index) => start + index);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function resolveChangeRequestApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'Unable to process this change request.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Change request not found.';
  }

  if (error.status === 409) {
    return 'This change request is no longer available.';
  }

  return fallback ?? 'An error occurred. Please try again.';
}
