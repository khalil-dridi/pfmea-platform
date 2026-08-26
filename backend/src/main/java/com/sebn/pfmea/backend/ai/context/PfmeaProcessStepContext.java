package com.sebn.pfmea.backend.ai.context;

import java.util.List;
import java.util.UUID;

public record PfmeaProcessStepContext(
        UUID id,
        UUID processId,
        Integer stepNumber,
        String name,
        String description,
        List<PfmeaWorkElementContext> workElements,
        List<PfmeaFunctionContext> functions,
        List<PfmeaFailureModeContext> failureModes
) {
}
