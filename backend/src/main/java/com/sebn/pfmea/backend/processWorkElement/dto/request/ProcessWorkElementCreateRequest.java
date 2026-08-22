package com.sebn.pfmea.backend.processWorkElement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ProcessWorkElementCreateRequest(

        @NotNull
        UUID processStepId,

        @NotNull
        Integer elementNumber,

        @NotBlank
        @Size(max = 150)
        String name,

        @Size(max = 500)
        String description
) {
}