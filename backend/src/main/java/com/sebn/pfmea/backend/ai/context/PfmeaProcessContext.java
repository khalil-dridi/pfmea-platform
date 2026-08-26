package com.sebn.pfmea.backend.ai.context;

import java.util.List;
import java.util.UUID;

public record PfmeaProcessContext(
        UUID id,
        String name,
        String processNumber,
        List<PfmeaProcessStepContext> processSteps
) {
}