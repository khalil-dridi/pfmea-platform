package com.sebn.pfmea.backend.failureCause.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record FailureCauseCreateRequest(

        @NotNull
        UUID failureModeId,

        @NotBlank
        @Size(max = 1000)
        String description
) {
}
