package com.sebn.pfmea.backend.failureMode.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FailureModeUpdateRequest(

        @NotBlank
        @Size(max = 1000)
        String description,

        @Size(max = 100)
        String failureCode
) {
}