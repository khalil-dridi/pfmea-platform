package com.sebn.pfmea.backend.dashboard.dto.response;

public record OptimizationCoverageResponse(
        long totalRiskAnalyses,
        long withOptimization,
        long withoutOptimization,
        double percentage
) {
}
