package com.sebn.pfmea.backend.optimization.dto.response;

import com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus;
import com.sebn.pfmea.backend.optimization.enums.OptimizationActionType;
import java.time.LocalDate;
import java.util.UUID;

public record OptimizationActionResponse(
        UUID id,
        UUID optimizationId,
        OptimizationActionType actionType,
        String description,
        String responsiblePerson,
        LocalDate targetCompletionDate,
        OptimizationActionStatus status,
        String evidence,
        LocalDate completionDate
) {
}