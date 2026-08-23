import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { ActionPriority, DetectionScope, RiskAnalysis } from '../models/risk-analysis.model';

export const DETECTION_SCOPES: readonly DetectionScope[] = ['FAILURE_CAUSE', 'FAILURE_MODE'];
export const ACTION_PRIORITIES: readonly ActionPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export function isRiskAnalysis(value: unknown): value is RiskAnalysis {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const scope = record['detectionScope'];
  const priority = record['actionPriority'];

  return (
    typeof record['id'] === 'string' &&
    typeof record['failureCauseId'] === 'string' &&
    (record['currentPreventionControl'] === null || typeof record['currentPreventionControl'] === 'string') &&
    typeof record['occurrence'] === 'number' &&
    (record['currentDetectionControl'] === null || typeof record['currentDetectionControl'] === 'string') &&
    typeof record['detection'] === 'number' &&
    (scope === 'FAILURE_CAUSE' || scope === 'FAILURE_MODE') &&
    (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') &&
    (record['specialProcess'] === null || typeof record['specialProcess'] === 'string') &&
    (record['specialCharacteristic'] === null || typeof record['specialCharacteristic'] === 'string')
  );
}

export function detectionScopeLabel(scope: DetectionScope): string {
  return scope === 'FAILURE_MODE' ? 'Failure Mode' : 'Failure Cause';
}

export function isMissingRiskAnalysis(error: HttpErrorResponse): boolean {
  if (error.status === 404) {
    return true;
  }

  const body = error.error;

  if (typeof body === 'string') {
    return body.toLowerCase().includes('risk analysis not found');
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    return typeof message === 'string' && message.toLowerCase().includes('risk analysis not found');
  }

  return false;
}

export function resolveRiskApiError(error: HttpErrorResponse, fallback?: string): string {
  if (error.status === 400) {
    return 'The risk analysis information is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Risk analysis context not found.';
  }

  if (error.status === 409) {
    return 'A risk analysis already exists for this failure cause.';
  }

  return fallback ?? 'Unable to load risk analysis. Please try again.';
}

export function requiredValueError(control: AbstractControl, label: string): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return `${label} is required.`;
  }

  return null;
}

export function controlPreview(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : 'Not defined';
}

export function priorityClass(priority: ActionPriority): string {
  return `risk-ap risk-ap--${priority.toLowerCase()}`;
}
