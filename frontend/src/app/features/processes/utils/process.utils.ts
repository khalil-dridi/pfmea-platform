import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { Process } from '../models/process.model';
import { ProcessMutationResult } from '../models/process-mutation-result.model';

export function isProcess(value: unknown): value is Process {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record['id'] === 'string' &&
    typeof record['name'] === 'string' &&
    typeof record['processNumber'] === 'string' &&
    typeof record['createdAt'] === 'string' &&
    typeof record['updatedAt'] === 'string'
  );
}

export function parseProcessBody(raw: string | null): Process | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isProcess(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function toProcessMutationResult(status: number, rawBody: string | null): ProcessMutationResult {
  const process = parseProcessBody(rawBody);

  if (status === 202) {
    return {
      status,
      outcome: 'pending',
      process: null
    };
  }

  return {
    status,
    outcome: 'applied',
    process
  };
}

export function formatProcessDateTime(value: string): string {
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

export function resolveProcessApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The process information is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Process not found.';
  }

  if (error.status === 409) {
    return 'A process with this information already exists.';
  }

  return fallback ?? 'An error occurred. Please try again.';
}

export function processNameError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Process name is required.';
  }

  if (control.hasError('maxlength')) {
    return 'Process name cannot exceed 150 characters.';
  }

  return null;
}

export function processNumberError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Process number is required.';
  }

  if (control.hasError('maxlength')) {
    return 'Process number cannot exceed 50 characters.';
  }

  return null;
}
