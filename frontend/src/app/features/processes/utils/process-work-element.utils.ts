import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { ProcessWorkElement } from '../models/process-work-element.model';
import { ProcessWorkElementMutationResult } from '../models/process-work-element-mutation-result.model';

export function isProcessWorkElement(value: unknown): value is ProcessWorkElement {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record['id'] === 'string' &&
    typeof record['processStepId'] === 'string' &&
    typeof record['elementNumber'] === 'number' &&
    typeof record['name'] === 'string' &&
    (record['description'] === null || typeof record['description'] === 'string') &&
    typeof record['createdAt'] === 'string' &&
    typeof record['updatedAt'] === 'string'
  );
}

export function parseWorkElementBody(raw: string | null): ProcessWorkElement | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isProcessWorkElement(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function toWorkElementMutationResult(
  status: number,
  rawBody: string | null,
  treatAsPending: boolean
): ProcessWorkElementMutationResult {
  const outcome = status === 202 || treatAsPending ? 'pending' : 'applied';

  return {
    status,
    outcome,
    workElement: parseWorkElementBody(rawBody)
  };
}

export function resolveWorkElementApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The work element information is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Process step not found.';
  }

  if (error.status === 409) {
    return 'A work element with this information already exists.';
  }

  return fallback ?? 'Unable to load work elements. Please try again.';
}

export function workElementNameError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Work element name is required.';
  }

  if (control.hasError('maxlength')) {
    return 'Work element name cannot exceed 150 characters.';
  }

  return null;
}

export function workElementNumberError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Element number is required.';
  }

  if (control.hasError('min')) {
    return 'Element number must be at least 1.';
  }

  return null;
}

export function workElementDescriptionError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('maxlength')) {
    return 'Description cannot exceed 500 characters.';
  }

  return null;
}
