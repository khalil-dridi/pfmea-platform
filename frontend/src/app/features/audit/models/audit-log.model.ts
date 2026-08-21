export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ENABLE'
  | 'DISABLE'
  | 'APPROVE'
  | 'REJECT';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  oldData: string | null;
  newData: string | null;
  performedById: string;
  performedByName: string;
  createdAt: string;
}
