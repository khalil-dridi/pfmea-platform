import { ProcessWorkElement } from './process-work-element.model';

export type ProcessWorkElementMutationOutcome = 'applied' | 'pending';

export interface ProcessWorkElementMutationResult {
  status: number;
  outcome: ProcessWorkElementMutationOutcome;
  workElement: ProcessWorkElement | null;
}
