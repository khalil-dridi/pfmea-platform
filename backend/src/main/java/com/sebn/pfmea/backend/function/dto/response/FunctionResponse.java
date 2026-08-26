package com.sebn.pfmea.backend.function.dto.response;

    import com.sebn.pfmea.backend.function.enums.FunctionType;
    import java.util.UUID;

    public record FunctionResponse(
            UUID id,
            FunctionType type,
            String description,
            UUID processId,
            UUID processStepId,
            UUID workElementId
    ) {
    }