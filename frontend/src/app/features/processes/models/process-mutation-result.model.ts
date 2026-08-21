import { Process } from './process.model';

export type ProcessMutationOutcome = 'applied' | 'pending';

export interface ProcessMutationResult {
  status: number;
  outcome: ProcessMutationOutcome;
  process: Process | null;
}
