package com.sebn.pfmea.backend.failureMode.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record FailureModeCreateRequest(

        @NotNull
        UUID processStepId,

        @NotBlank
        @Size(max = 1000)
        String description,

        @Size(max = 100)
        String failureCode
) {
}
