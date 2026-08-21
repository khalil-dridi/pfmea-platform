import { HttpErrorResponse } from '@angular/common/http';
import { AuditAction, AuditLog } from '../models/audit-log.model';

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'ENABLE',
  'DISABLE',
  'APPROVE',
  'REJECT'
];

export function actionLabel(action: AuditAction): string {
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

export function actionSummary(log: AuditLog): string {
  const entity = capitalize(log.entityType.replaceAll('_', ' ').toLowerCase());

  if (log.action === 'CREATE') {
    return `${capitalize(entity)} created`;
  }

  if (log.action === 'UPDATE') {
    return `${capitalize(entity)} updated`;
  }

  if (log.action === 'DELETE') {
    return `${capitalize(entity)} deleted`;
  }

  if (log.action === 'ENABLE') {
    return `${capitalize(entity)} enabled`;
  }

  if (log.action === 'DISABLE') {
    return `${capitalize(entity)} disabled`;
  }

  if (log.action === 'APPROVE') {
    return `${capitalize(entity)} approved`;
  }

  return `${capitalize(entity)} rejected`;
}

export function formatAuditDateTime(value: string): string {
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

export function shortenId(value: string | null): string {
  if (!value) {
    return '—';
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…`;
}

export function badgeClass(action: AuditAction): string {
  if (action === 'CREATE' || action === 'ENABLE' || action === 'APPROVE') {
    return 'badge badge--success';
  }

  if (action === 'UPDATE') {
    return 'badge badge--primary';
  }

  return 'badge badge--danger';
}

export function isUsableUserId(value: string | null | undefined): value is string {
  if (value === null || value === undefined) {
    return false;
  }

  const userId = value.trim();
  return userId.length > 0 && userId !== 'undefined' && userId !== 'null';
}

export function resolveAuditApiError(
  error: HttpErrorResponse,
  fallback?: string,
  notFoundMessage = 'Audit record not found.'
): string {
  if (error.status === 400) {
    return 'Unable to load the requested history.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to view this history.';
  }

  if (error.status === 404) {
    return notFoundMessage;
  }

  return fallback ?? 'Unable to load history. Please try again.';
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
