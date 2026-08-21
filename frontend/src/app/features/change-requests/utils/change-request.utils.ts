import { HttpErrorResponse } from '@angular/common/http';
import { ChangeRequestOperation, ChangeRequestStatus } from '../models/change-request.model';

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
