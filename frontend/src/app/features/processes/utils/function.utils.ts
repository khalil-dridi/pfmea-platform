import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { FunctionMutationResult } from '../models/function-mutation-result.model';
import { FunctionType, PfmeaFunction } from '../models/function.model';

export const FUNCTION_TYPES: readonly FunctionType[] = [
  'PROCESS_ITEM',
  'PROCESS_STEP',
  'WORK_ELEMENT'
];

export function functionTypeLabel(type: FunctionType): string {
  if (type === 'PROCESS_ITEM') {
    return 'Process';
  }

  if (type === 'PROCESS_STEP') {
    return 'Process Step';
  }

  return 'Work Element';
}

export function isPfmeaFunction(value: unknown): value is PfmeaFunction {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const type = record['type'];

  return (
    typeof record['id'] === 'string' &&
    (type === 'PROCESS_ITEM' || type === 'PROCESS_STEP' || type === 'WORK_ELEMENT') &&
    typeof record['description'] === 'string' &&
    (record['processId'] === null || typeof record['processId'] === 'string') &&
    (record['processStepId'] === null || typeof record['processStepId'] === 'string') &&
    (record['workElementId'] === null || typeof record['workElementId'] === 'string')
  );
}

export function parseFunctionBody(raw: string | null): PfmeaFunction | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPfmeaFunction(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function toFunctionMutationResult(
  status: number,
  rawBody: string | null,
  treatAsPending: boolean
): FunctionMutationResult {
  return {
    status,
    outcome: status === 202 || treatAsPending ? 'pending' : 'applied',
    functionItem: parseFunctionBody(rawBody)
  };
}

export function resolveFunctionApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The function information is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Function context not found.';
  }

  if (error.status === 409) {
    return 'A function with this information already exists.';
  }

  return fallback ?? 'Unable to load functions. Please try again.';
}

export function functionDescriptionError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Function description is required.';
  }

  if (control.hasError('maxlength')) {
    return 'Function description cannot exceed 1000 characters.';
  }

  return null;
}

export function functionTypeError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Function type is required.';
  }

  return null;
}

export function functionWorkElementError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'A work element is required for this function type.';
  }

  return null;
}

export function mergeFunctions(groups: PfmeaFunction[][]): PfmeaFunction[] {
  const byId = new Map<string, PfmeaFunction>();

  for (const group of groups) {
    for (const item of group) {
      byId.set(item.id, item);
    }
  }

  return [...byId.values()];
}
