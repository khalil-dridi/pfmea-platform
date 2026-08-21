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
