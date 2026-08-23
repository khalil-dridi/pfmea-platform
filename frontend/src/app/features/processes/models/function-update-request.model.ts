import { FunctionType } from './function.model';

export interface FunctionUpdateRequest {
  type: FunctionType;
  description: string;
}
