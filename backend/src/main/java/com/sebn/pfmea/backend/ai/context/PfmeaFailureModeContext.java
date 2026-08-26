package com.sebn.pfmea.backend.ai.context;

import java.util.List;
import java.util.UUID;

public record PfmeaFailureModeContext(
        UUID id,
        UUID processStepId,
        String description,
        String failureCode,
        PfmeaFailureEffectContext failureEffect,
        List<PfmeaFailureCauseContext> failureCauses
) {
}