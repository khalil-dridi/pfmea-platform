import { ProcessStep } from './process-step.model';

export type ProcessStepMutationOutcome = 'applied' | 'pending';

export interface ProcessStepMutationResult {
  status: number;
  outcome: ProcessStepMutationOutcome;
  processStep: ProcessStep | null;
}
