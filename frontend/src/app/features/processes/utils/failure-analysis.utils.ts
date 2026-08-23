import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';
import { FailureCause } from '../models/failure-cause.model';
import { FailureEffect } from '../models/failure-effect.model';
import { FailureMode } from '../models/failure-mode.model';
import { FailureMutationResult } from '../models/failure-mutation-result.model';

export function isFailureMode(value: unknown): value is FailureMode {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record['id'] === 'string' &&
    typeof record['processStepId'] === 'string' &&
    typeof record['description'] === 'string' &&
    (record['failureCode'] === null || typeof record['failureCode'] === 'string')
  );
}

export function isFailureEffect(value: unknown): value is FailureEffect {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record['id'] === 'string' &&
    typeof record['failureModeId'] === 'string' &&
    (record['ourPlant'] === null || typeof record['ourPlant'] === 'string') &&
    (record['shipToPlant'] === null || typeof record['shipToPlant'] === 'string') &&
    (record['endUser'] === null || typeof record['endUser'] === 'string') &&
    typeof record['severity'] === 'number'
  );
}

export function isFailureCause(value: unknown): value is FailureCause {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record['id'] === 'string' &&
    typeof record['failureModeId'] === 'string' &&
    typeof record['description'] === 'string'
  );
}

export function parseJsonBody<T>(raw: string | null, guard: (value: unknown) => value is T): T | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function toFailureMutationResult<T>(
  status: number,
  rawBody: string | null,
  treatAsPending: boolean,
  guard: (value: unknown) => value is T
): FailureMutationResult<T> {
  return {
    status,
    outcome: status === 202 || treatAsPending ? 'pending' : 'applied',
    item: parseJsonBody(rawBody, guard)
  };
}

export function mutateFailureEntity<TRequest, TResponse>(
  http: HttpClient,
  method: 'POST' | 'PUT',
  url: string,
  body: TRequest,
  treatAsPending: boolean,
  guard: (value: unknown) => value is TResponse
): Observable<FailureMutationResult<TResponse>> {
  return http
    .request(method, url, {
      body,
      observe: 'response',
      responseType: 'text'
    })
    .pipe(
      map(response => toFailureMutationResult(response.status, response.body, treatAsPending, guard)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 202) {
          return of(toFailureMutationResult(202, null, true, guard));
        }

        throw error;
      })
    );
}

export function resolveFailureApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The submitted information is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Failure analysis context not found.';
  }

  if (error.status === 409) {
    return 'This failure analysis record already exists.';
  }

  return fallback ?? 'Unable to load failure analysis. Please try again.';
}

export function optionalText(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : 'Not specified';
}

export function optionalRequestText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function requiredTextError(control: AbstractControl, label: string, maxLength: number): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return `${label} is required.`;
  }

  if (control.hasError('maxlength')) {
    return `${label} cannot exceed ${maxLength} characters.`;
  }

  return null;
}

export function optionalTextError(control: AbstractControl, label: string, maxLength: number): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('maxlength')) {
    return `${label} cannot exceed ${maxLength} characters.`;
  }

  return null;
}

export function severityError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Severity is required.';
  }

  return null;
}
