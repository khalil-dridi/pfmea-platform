import { HttpErrorResponse } from '@angular/common/http';
import { Notification } from '../models/notification.model';

export function resolveNotificationRoute(notification: Notification): string | null {
  const entityType = notification.relatedEntityType;
  const entityId = notification.relatedEntityId;

  if (!entityType || !entityId) {
    return null;
  }

  if (entityType === 'PROCESS') {
    return `/processes/${entityId}`;
  }

  if (entityType === 'CHANGE_REQUEST') {
    return `/change-requests/${entityId}`;
  }

  return null;
}

export function resolveNotificationApiError(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 400) {
    return 'Unable to process this notification.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to perform this action.';
  }

  if (error.status === 404) {
    return 'Notification not found.';
  }

  return fallback;
}
