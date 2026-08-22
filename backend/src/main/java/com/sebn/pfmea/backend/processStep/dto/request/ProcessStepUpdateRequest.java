package com.sebn.pfmea.backend.processStep.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProcessStepUpdateRequest(

        @NotNull
        Integer stepNumber,

        @NotNull
        @Size(max = 150)
        String name,

        @Size(max = 500)
        String description
) {
}
