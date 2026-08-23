import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { ProcessStep } from '../models/process-step.model';
import { ProcessStepMutationResult } from '../models/process-step-mutation-result.model';

export function isProcessStep(value: unknown): value is ProcessStep {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record['id'] === 'string' &&
    typeof record['processId'] === 'string' &&
    typeof record['stepNumber'] === 'number' &&
    typeof record['name'] === 'string' &&
    (record['description'] === null || typeof record['description'] === 'string') &&
    typeof record['createdAt'] === 'string' &&
    typeof record['updatedAt'] === 'string'
  );
}

export function parseProcessStepBody(raw: string | null): ProcessStep | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isProcessStep(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function toProcessStepMutationResult(
  status: number,
  rawBody: string | null,
  treatAsPending: boolean
): ProcessStepMutationResult {
  return {
    status,
    outcome: status === 202 || treatAsPending ? 'pending' : 'applied',
    processStep: parseProcessStepBody(rawBody)
  };
}

export function resolveProcessStepApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The process step information is invalid.';
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
    return 'A process step with this information already exists.';
  }

  return fallback ?? 'Unable to load process steps. Please try again.';
}

export function processStepNameError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Process step name is required.';
  }

  if (control.hasError('maxlength')) {
    return 'Process step name cannot exceed 150 characters.';
  }

  return null;
}

export function processStepNumberError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Step number is required.';
  }

  if (control.hasError('min')) {
    return 'Step number must be at least 1.';
  }

  return null;
}

export function processStepDescriptionError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('maxlength')) {
    return 'Description cannot exceed 500 characters.';
  }

  return null;
}
