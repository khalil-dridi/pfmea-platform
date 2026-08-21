export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ChangeRequestOperation = 'CREATE' | 'UPDATE';

export interface ChangeRequest {
  id: string;
  entityType: string;
  entityId: string | null;
  operation: ChangeRequestOperation;
  oldData: string;
  newData: string;
  requestedById: string;
  requestedByName: string;
  status: ChangeRequestStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
