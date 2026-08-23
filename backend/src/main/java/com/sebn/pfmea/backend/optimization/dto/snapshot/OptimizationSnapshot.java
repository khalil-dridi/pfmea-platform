package com.sebn.pfmea.backend.optimization.dto.snapshot;

import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import java.util.UUID;

public record OptimizationSnapshot(
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