import { HttpErrorResponse } from '@angular/common/http';
import { ChangeRequest, ChangeRequestOperation, ChangeRequestStatus } from '../models/change-request.model';

export type JsonObject = Record<string, unknown>;

export interface ComparisonRow {
  field: string;
  label: string;
  previous: string;
  proposed: string;
  changed: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Process Name',
  processNumber: 'Process Number',
  id: 'ID',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  entityType: 'Entity Type',
  entityId: 'Entity ID'
};

const FIELD_ORDER = ['name', 'processNumber', 'id', 'createdAt', 'updatedAt'];

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

export function parseChangeRequestData(raw: string): JsonObject | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }

    return null;
  } catch {
    return null;
  }
}

export function isEmptyJsonObject(value: JsonObject | null): boolean {
  return value === null || Object.keys(value).length === 0;
}

export function formatJsonFallback(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function buildComparisonRows(request: ChangeRequest): ComparisonRow[] | null {
  const previous = parseChangeRequestData(request.oldData);
  const proposed = parseChangeRequestData(request.newData);

  if (previous === null && proposed === null) {
    return null;
  }

  const keys = orderedKeys(previous, proposed);

  if (keys.length === 0) {
    return null;
  }

  return keys.map(field => {
    const previousValue = formatFieldValue(previous?.[field]);
    const proposedValue = formatFieldValue(proposed?.[field]);

    return {
      field,
      label: fieldLabel(field),
      previous: isEmptyJsonObject(previous) ? '—' : previousValue,
      proposed: proposedValue,
      changed: previousValue !== proposedValue
    };
  });
}

function orderedKeys(previous: JsonObject | null, proposed: JsonObject | null): string[] {
  const keys = new Set<string>([
    ...Object.keys(previous ?? {}),
    ...Object.keys(proposed ?? {})
  ]);

  const ordered = FIELD_ORDER.filter(key => keys.has(key));
  const remaining = [...keys].filter(key => !FIELD_ORDER.includes(key)).sort();

  return [...ordered, ...remaining];
}

function fieldLabel(field: string): string {
  if (field in FIELD_LABELS) {
    return FIELD_LABELS[field];
  }

  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, character => character.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return formatRequestDateTime(value);
    }

    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value) && value.length >= 3 && value.every(item => typeof item === 'number')) {
    const year = value[0];
    const month = value[1];
    const day = value[2];
    const hour = value[3] ?? 0;
    const minute = value[4] ?? 0;

    if (
      typeof year === 'number' &&
      typeof month === 'number' &&
      typeof day === 'number' &&
      typeof hour === 'number' &&
      typeof minute === 'number'
    ) {
      return formatRequestDateTime(
        `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
      );
    }
  }

  return JSON.stringify(value);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
