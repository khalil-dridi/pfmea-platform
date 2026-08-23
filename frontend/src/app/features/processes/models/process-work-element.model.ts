export interface ProcessWorkElement {
  id: string;
  processStepId: string;
  elementNumber: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
