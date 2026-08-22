package com.sebn.pfmea.backend.function.dto.request;

import com.sebn.pfmea.backend.function.enums.FunctionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record FunctionCreateRequest(

        @NotNull
        FunctionType type,

        @NotBlank
        @Size(max = 1000)
        String description,

        UUID processId,

        UUID processStepId,

        UUID workElementId
) {
}