export type DetectionScope = 'FAILURE_CAUSE' | 'FAILURE_MODE';
export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskAnalysis {
  id: string;
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
