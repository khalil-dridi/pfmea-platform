package com.sebn.pfmea.backend.search.dto.request;

import com.sebn.pfmea.backend.search.enums.SearchEntityType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SearchRequest(

        @Size(max = 255)
        String q,

        SearchEntityType entityType,

        UUID processId,

        UUID processStepId,

        @Min(0)
        Integer page,

        @Min(1)
        @Max(100)
        Integer size
) {
}
