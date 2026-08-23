export interface FailureMode {
  id: string;
  processStepId: string;
  description: string;
  failureCode: string | null;
}
