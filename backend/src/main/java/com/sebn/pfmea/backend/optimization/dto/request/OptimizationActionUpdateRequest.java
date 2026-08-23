package com.sebn.pfmea.backend.optimization.dto.request;

import com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus;
import com.sebn.pfmea.backend.optimization.enums.OptimizationActionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record OptimizationActionUpdateRequest(

        @NotNull
        OptimizationActionType actionType,

        @NotBlank
        @Size(max = 2000)
        String description,

        @Size(max = 255)
        String responsiblePerson,

        LocalDate targetCompletionDate,

        @NotNull
        OptimizationActionStatus status,

        @Size(max = 2000)
        String evidence,

        LocalDate completionDate
) {
}
