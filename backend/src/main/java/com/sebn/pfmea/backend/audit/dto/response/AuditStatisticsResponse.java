package com.sebn.pfmea.backend.audit.dto.response;

public record AuditStatisticsResponse(
        long totalEvents,
        long approved,
        long rejected,
        long pending
) {
}