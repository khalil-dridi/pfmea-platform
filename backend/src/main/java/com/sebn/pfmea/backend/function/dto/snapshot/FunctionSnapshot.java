package com.sebn.pfmea.backend.function.dto.snapshot;

import com.sebn.pfmea.backend.function.enums.FunctionType;
import java.util.UUID;

public record FunctionSnapshot(
        UUID id,
        FunctionType type,
        String description,
        UUID processId,
        UUID processStepId,
        UUID workElementId
) {
}
