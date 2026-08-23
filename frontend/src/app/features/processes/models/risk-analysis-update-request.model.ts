import { ActionPriority, DetectionScope } from './risk-analysis.model';

export interface RiskAnalysisUpdateRequest {
  currentPreventionControl: string | null;
  occurrence: number;
  currentDetectionControl: string | null;
  detection: number;
  detectionScope: DetectionScope;
  actionPriority: ActionPriority;
  specialProcess: string | null;
  specialCharacteristic: string | null;
}
