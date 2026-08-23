package com.sebn.pfmea.backend.riskAnalysis.dto.request;

import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import com.sebn.pfmea.backend.riskAnalysis.enums.DetectionScope;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RiskAnalysisUpdateRequest(

        @Size(max = 2000)
        String currentPreventionControl,

        @NotNull
        Integer occurrence,

        @Size(max = 2000)
        String currentDetectionControl,

        @NotNull
        Integer detection,

        @NotNull
        DetectionScope detectionScope,

        @NotNull
        ActionPriority actionPriority,

        @Size(max = 1000)
        String specialProcess,

        @Size(max = 1000)
        String specialCharacteristic
) {
}
