import { FunctionType } from './function.model';

export interface FunctionCreateRequest {
  type: FunctionType;
  description: string;
  processId: string | null;
  processStepId: string | null;
  workElementId: string | null;
}
