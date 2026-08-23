export type OptimizationActionType = 'PREVENTION' | 'DETECTION';
export type OptimizationActionStatus = 'IN_APPLICATION' | 'CLOSED';

export interface OptimizationAction {
  id: string;
  optimizationId: string;
  actionType: OptimizationActionType;
  description: string;
  responsiblePerson: string | null;
  targetCompletionDate: string | null;
  status: OptimizationActionStatus;
  evidence: string | null;
  completionDate: string | null;
}
