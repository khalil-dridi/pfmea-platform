import { HttpErrorResponse } from '@angular/common/http';
import { ActionPriority } from '../models/risk-analysis.model';
import { Optimization } from '../models/optimization.model';
import { OptimizationAction, OptimizationActionStatus, OptimizationActionType } from '../models/optimization-action.model';

export const OPTIMIZATION_ACTION_TYPES: readonly OptimizationActionType[] = ['PREVENTION', 'DETECTION'];
export const OPTIMIZATION_ACTION_STATUSES: readonly OptimizationActionStatus[] = ['IN_APPLICATION', 'CLOSED'];

export function isOptimization(value: unknown): value is Optimization {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const priority = record['actionPriority'];

  return (
    typeof record['id'] === 'string' &&
    typeof record['riskAnalysisId'] === 'string' &&
    typeof record['severity'] === 'number' &&
    typeof record['occurrence'] === 'number' &&
    typeof record['detection'] === 'number' &&
    (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') &&
    (record['specialProcess'] === null || typeof record['specialProcess'] === 'string') &&
    (record['specialCharacteristic'] === null || typeof record['specialCharacteristic'] === 'string') &&
    (record['remarks'] === null || typeof record['remarks'] === 'string')
  );
}

export function isOptimizationAction(value: unknown): value is OptimizationAction {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const type = record['actionType'];
  const status = record['status'];

  return (
    typeof record['id'] === 'string' &&
    typeof record['optimizationId'] === 'string' &&
    (type === 'PREVENTION' || type === 'DETECTION') &&
    typeof record['description'] === 'string' &&
    (record['responsiblePerson'] === null || typeof record['responsiblePerson'] === 'string') &&
    (record['targetCompletionDate'] === null || typeof record['targetCompletionDate'] === 'string') &&
    (status === 'IN_APPLICATION' || status === 'CLOSED') &&
    (record['evidence'] === null || typeof record['evidence'] === 'string') &&
    (record['completionDate'] === null || typeof record['completionDate'] === 'string')
  );
}

export function isMissingOptimization(error: HttpErrorResponse): boolean {
  if (error.status === 404) {
    return true;
  }

  const body = error.error;

  if (typeof body === 'string') {
    return body.toLowerCase().includes('optimization not found');
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    return typeof message === 'string' && message.toLowerCase().includes('optimization not found');
  }

  return false;
}

export function resolveOptimizationApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The submitted optimization information is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Optimization context not found.';
  }

  if (error.status === 409) {
    return 'An optimization already exists for this risk analysis.';
  }

  return fallback ?? 'Unable to load optimization data. Please try again.';
}

export function actionTypeLabel(type: OptimizationActionType): string {
  return type === 'DETECTION' ? 'Detection' : 'Prevention';
}

export function actionStatusLabel(status: OptimizationActionStatus): string {
  return status === 'CLOSED' ? 'Closed' : 'In application';
}

export function actionStatusClass(status: OptimizationActionStatus): string {
  return status === 'CLOSED' ? 'opt-status opt-status--closed' : 'opt-status opt-status--progress';
}

export function actionTypeClass(type: OptimizationActionType): string {
  return type === 'DETECTION' ? 'opt-type opt-type--detection' : 'opt-type opt-type--prevention';
}

export function optionalDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function displayDate(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : 'Not specified';
}

export function numericDisplay(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value);
}

export function priorityBadge(priority: ActionPriority): string {
  return `risk-ap risk-ap--${priority.toLowerCase()}`;
}
