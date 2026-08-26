package com.sebn.pfmea.backend.ai.context;

import java.util.UUID;

public record PfmeaFailureCauseContext(
        UUID id,
        UUID failureModeId,
        String description,
        PfmeaRiskAnalysisContext riskAnalysis,
        PfmeaOptimizationContext optimization
) {
}