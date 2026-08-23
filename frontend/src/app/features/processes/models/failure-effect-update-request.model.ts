export interface FailureEffectUpdateRequest {
  ourPlant: string | null;
  shipToPlant: string | null;
  endUser: string | null;
  severity: number;
}
