export interface ProcessStep {
  id: string;
  processId: string;
  stepNumber: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
