import { PfmeaFunction } from './function.model';

export type FunctionMutationOutcome = 'applied' | 'pending';

export interface FunctionMutationResult {
  status: number;
  outcome: FunctionMutationOutcome;
  functionItem: PfmeaFunction | null;
}
