package com.sebn.pfmea.backend.dashboard.dto.response;

public record OptimizationActionsResponse(
        long total,
        long inApplication,
        long closed
) {
}