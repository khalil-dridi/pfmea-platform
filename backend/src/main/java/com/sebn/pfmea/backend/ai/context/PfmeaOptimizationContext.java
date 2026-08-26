package com.sebn.pfmea.backend.ai.context;

import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import java.util.List;
import java.util.UUID;

public record PfmeaOptimizationContext(
        UUID id,
        UUID riskAnalysisId,
        Integer severity,
        Integer occurrence,
        Integer detection,
        ActionPriority actionPriority,
        String specialProcess,
        String specialCharacteristic,
        String remarks,
        List<PfmeaOptimizationActionContext> actions
) {
}