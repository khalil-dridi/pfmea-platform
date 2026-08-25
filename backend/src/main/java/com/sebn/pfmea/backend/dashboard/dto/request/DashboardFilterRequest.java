package com.sebn.pfmea.backend.dashboard.dto.request;

import java.util.UUID;

public record DashboardFilterRequest(
        UUID processId,
        UUID processStepId
) {
}
