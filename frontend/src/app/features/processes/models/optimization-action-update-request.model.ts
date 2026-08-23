import { OptimizationActionStatus, OptimizationActionType } from './optimization-action.model';

export interface OptimizationActionUpdateRequest {
  actionType: OptimizationActionType;
  description: string;
  responsiblePerson: string | null;
  targetCompletionDate: string | null;
  status: OptimizationActionStatus;
  evidence: string | null;
  completionDate: string | null;
}
