export type FunctionType = 'PROCESS_ITEM' | 'PROCESS_STEP' | 'WORK_ELEMENT';

export interface PfmeaFunction {
  id: string;
  type: FunctionType;
  description: string;
  processId: string | null;
  processStepId: string | null;
  workElementId: string | null;
}
