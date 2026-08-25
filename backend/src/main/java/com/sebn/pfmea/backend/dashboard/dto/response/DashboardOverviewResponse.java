package com.sebn.pfmea.backend.dashboard.dto.response;

public record DashboardOverviewResponse(
        PfmeaCoverageResponse coverage,
        RiskDistributionResponse riskDistribution,
        RiskAnalysisCoverageResponse riskAnalysisCoverage,
        OptimizationCoverageResponse optimizationCoverage,
        RiskImprovementResponse riskImprovement,
        OptimizationActionsResponse optimizationActions,
        AreasNeedingAttentionResponse areasNeedingAttention
) {
}
