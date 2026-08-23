export interface FailureEffectCreateRequest {
  failureModeId: string;
  ourPlant: string | null;
  shipToPlant: string | null;
  endUser: string | null;
  severity: number;
}
