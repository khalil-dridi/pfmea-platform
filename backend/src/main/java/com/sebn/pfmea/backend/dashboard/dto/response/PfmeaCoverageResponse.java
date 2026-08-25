package com.sebn.pfmea.backend.dashboard.dto.response;

public record PfmeaCoverageResponse(
        long processes,
        long processSteps,
        long workElements,
        long functions,
        long failureModes,
        long failureCauses
) {
}