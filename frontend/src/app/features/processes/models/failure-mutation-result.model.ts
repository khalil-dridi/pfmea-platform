export type FailureMutationOutcome = 'applied' | 'pending';

export interface FailureMutationResult<T> {
  status: number;
  outcome: FailureMutationOutcome;
  item: T | null;
}
