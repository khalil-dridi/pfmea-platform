import { HttpErrorResponse } from '@angular/common/http';
import { Notification, NotificationPage, NotificationPayload } from '../models/notification.model';

export const NOTIFICATION_PAGE_SIZE = 10;

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

export function isNotificationRead(payload: NotificationPayload | Notification): boolean {
  if ('isRead' in payload && payload.isRead === true) {
    return true;
  }

  return payload.read === true;
}

export function toNotification(payload: NotificationPayload): Notification {
  return {
    id: payload.id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId: payload.relatedEntityId,
    read: isNotificationRead(payload),
    readAt: payload.readAt,
    createdAt: payload.createdAt
  };
}

export function readNotificationPage(value: unknown): NotificationPage<NotificationPayload> {
  const record = isRecord(value) ? value : {};
  const rawContent = record['content'];
  const content = Array.isArray(rawContent)
    ? rawContent.filter(isNotificationPayload)
    : [];
  const totalElements = finiteNumber(record['totalElements'], content.length);
  const totalPages = finiteNumber(record['totalPages'], 0);
  const number = finiteNumber(record['number'], 0);
  const last = record['last'] === true || (totalPages > 0 && number >= totalPages - 1) || content.length === 0;

  return {
    content,
    number,
    size: finiteNumber(record['size'], NOTIFICATION_PAGE_SIZE),
    numberOfElements: finiteNumber(record['numberOfElements'], content.length),
    totalElements,
    totalPages,
    first: record['first'] === true || number === 0,
    last
  };
}

function isNotificationPayload(value: unknown): value is NotificationPayload {
  return isRecord(value) && typeof value['id'] === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
