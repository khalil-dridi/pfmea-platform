package com.sebn.pfmea.backend.riskAnalysis.dto.response;

import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import com.sebn.pfmea.backend.riskAnalysis.enums.DetectionScope;
import java.util.UUID;

public record RiskAnalysisResponse(
        UUID id,
        UUID failureCauseId,
        String currentPreventionControl,
        Integer occurrence,
        String currentDetectionControl,
        Integer detection,
        DetectionScope detectionScope,
        ActionPriority actionPriority,
        String specialProcess,
        String specialCharacteristic
) {
}