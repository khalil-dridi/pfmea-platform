export type NotificationType =
  | 'CHANGE_REQUEST_CREATED'
  | 'CHANGE_REQUEST_APPROVED'
  | 'CHANGE_REQUEST_REJECTED'
  | 'ACTION_ASSIGNED'
  | 'ACTION_DUE'
  | 'ACTION_COMPLETED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  read?: boolean;
  isRead?: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage<T = NotificationPayload> {
  content: T[];
  number: number;
  size: number;
  numberOfElements?: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}
