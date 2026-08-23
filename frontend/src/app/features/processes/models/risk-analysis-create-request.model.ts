import { ActionPriority, DetectionScope } from './risk-analysis.model';

export interface RiskAnalysisCreateRequest {
  failureCauseId: string;
  currentPreventionControl: string | null;
  occurrence: number;
  currentDetectionControl: string | null;
  detection: number;
  detectionScope: DetectionScope;
  actionPriority: ActionPriority;
  specialProcess: string | null;
  specialCharacteristic: string | null;
}
