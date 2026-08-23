export interface FailureModeCreateRequest {
  processStepId: string;
  description: string;
  failureCode: string | null;
}
