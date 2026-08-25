package com.sebn.pfmea.backend.dashboard.dto.response;

public record RiskImprovementResponse(
        RiskDistributionResponse current,
        RiskDistributionResponse optimized
) {
}
