import { ActionPriority } from './risk-analysis.model';

export interface OptimizationUpdateRequest {
  severity: number;
  occurrence: number;
  detection: number;
  actionPriority: ActionPriority;
  specialProcess: string | null;
  specialCharacteristic: string | null;
  remarks: string | null;
}
