export interface PfmeaCoverage {
  processes: number;
  processSteps: number;
  workElements: number;
  functions: number;
  failureModes: number;
  failureCauses: number;
}

export interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
  notDefined: number;
}

export interface RiskAnalysisCoverage {
  totalFailureCauses: number;
  withRiskAnalysis: number;
  withoutRiskAnalysis: number;
  percentage: number;
}

export interface OptimizationCoverage {
  totalRiskAnalyses: number;
  withOptimization: number;
  withoutOptimization: number;
  percentage: number;
}

export interface RiskImprovement {
  current: RiskDistribution;
  optimized: RiskDistribution;
}

export interface OptimizationActions {
  total: number;
  inApplication: number;
  closed: number;
}

export interface AreasNeedingAttention {
  failureCausesWithoutRiskAnalysis: number;
  riskAnalysesWithoutOptimization: number;
  highPriorityRisks: number;
  optimizationActionsInApplication: number;
}

export interface DashboardOverview {
  coverage: PfmeaCoverage;
  riskDistribution: RiskDistribution;
  riskAnalysisCoverage: RiskAnalysisCoverage;
  optimizationCoverage: OptimizationCoverage;
  riskImprovement: RiskImprovement;
  optimizationActions: OptimizationActions;
  areasNeedingAttention: AreasNeedingAttention;
}

export interface DashboardFilter {
  processId: string | null;
  processStepId: string | null;
}
