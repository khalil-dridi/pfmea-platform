package com.sebn.pfmea.backend.ai.context;

import com.sebn.pfmea.backend.function.enums.FunctionType;
import java.util.UUID;

public record PfmeaFunctionContext(
        UUID id,
        FunctionType type,
        String description,
        UUID processId,
        UUID processStepId,
        UUID workElementId
) {
}