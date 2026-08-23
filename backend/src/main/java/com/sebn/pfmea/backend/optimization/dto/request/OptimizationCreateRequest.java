package com.sebn.pfmea.backend.optimization.dto.request;

import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record OptimizationCreateRequest(

        @NotNull
        UUID riskAnalysisId,

        @NotNull
        Integer severity,

        @NotNull
        Integer occurrence,

        @NotNull
        Integer detection,

        @NotNull
        ActionPriority actionPriority,

        @Size(max = 1000)
        String specialProcess,

        @Size(max = 1000)
        String specialCharacteristic,

        @Size(max = 2000)
        String remarks
) {
}