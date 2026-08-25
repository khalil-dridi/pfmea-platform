package com.sebn.pfmea.backend.dashboard.dto.response;

public record RiskDistributionResponse(
        long high,
        long medium,
        long low,
        long notDefined
) {
}
