package com.sebn.pfmea.backend.function.dto.request;

import com.sebn.pfmea.backend.function.enums.FunctionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FunctionUpdateRequest(

        @NotNull
        FunctionType type,

        @NotBlank
        @Size(max = 1000)
        String description
) {
}