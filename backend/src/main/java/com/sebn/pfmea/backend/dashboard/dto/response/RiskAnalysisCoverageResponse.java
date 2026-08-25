package com.sebn.pfmea.backend.dashboard.dto.response;


    public record RiskAnalysisCoverageResponse(
            long totalFailureCauses,
            long withRiskAnalysis,
            long withoutRiskAnalysis,
            double percentage
    ) {
    }