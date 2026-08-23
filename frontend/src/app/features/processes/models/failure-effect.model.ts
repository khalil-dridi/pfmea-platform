export interface FailureEffect {
  id: string;
  failureModeId: string;
  ourPlant: string | null;
  shipToPlant: string | null;
  endUser: string | null;
  severity: number;
}
