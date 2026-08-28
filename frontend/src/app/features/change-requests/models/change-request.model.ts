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

export type MyRequestStatusFilter = 'ALL' | ChangeRequestStatus;
export type MyRequestOperationFilter = 'ALL' | ChangeRequestOperation;

export const MY_REQUEST_PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_MY_REQUEST_PAGE_SIZE = 10;

export interface MyRequestsQuery {
  page: number;
  size: number;
  search?: string;
  operation?: ChangeRequestOperation;
  status?: ChangeRequestStatus;
  from?: string;
  to?: string;
}
