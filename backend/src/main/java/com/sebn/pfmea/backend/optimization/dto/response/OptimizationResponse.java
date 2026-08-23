package com.sebn.pfmea.backend.optimization.dto.response;

import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import java.util.UUID;

public record OptimizationResponse(
        UUID id,
        UUID riskAnalysisId,
        Integer severity,
        Integer occurrence,
        Integer detection,
        ActionPriority actionPriority,
        String specialProcess,
        String specialCharacteristic,
        String remarks
) {
}
