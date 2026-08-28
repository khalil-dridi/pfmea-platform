import { ChangeRequestOperation, ChangeRequestStatus } from './change-request.model';

export type ValidationStatusFilter = 'ALL' | ChangeRequestStatus;
export type ValidationOperationFilter = 'ALL' | ChangeRequestOperation;
export type ValidationSort = 'newest' | 'oldest';
