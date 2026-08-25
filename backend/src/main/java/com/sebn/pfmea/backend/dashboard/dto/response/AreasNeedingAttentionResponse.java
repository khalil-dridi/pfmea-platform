package com.sebn.pfmea.backend.dashboard.dto.response;

public record AreasNeedingAttentionResponse(
        long failureCausesWithoutRiskAnalysis,
        long riskAnalysesWithoutOptimization,
        long highPriorityRisks,
        long optimizationActionsInApplication
) {
}