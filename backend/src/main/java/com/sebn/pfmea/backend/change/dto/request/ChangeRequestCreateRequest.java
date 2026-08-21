package com.sebn.pfmea.backend.change.dto.request;

import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ChangeRequestCreateRequest(

        @NotBlank
        @Size(max = 100)
        String entityType,


        UUID entityId,

        @NotNull
        ChangeRequestOperation operation,

        @NotBlank
        String oldData,

        @NotBlank
        String newData
) {
}
