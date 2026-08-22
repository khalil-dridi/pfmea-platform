package com.sebn.pfmea.backend.failureCause.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FailureCauseUpdateRequest(

        @NotBlank
        @Size(max = 1000)
        String description
) {
}