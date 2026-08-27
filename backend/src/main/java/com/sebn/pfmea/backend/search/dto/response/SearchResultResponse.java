package com.sebn.pfmea.backend.search.dto.response;

import com.sebn.pfmea.backend.search.enums.SearchEntityType;

import java.util.UUID;

public record SearchResultResponse(

        UUID id,

        SearchEntityType entityType,

        String title,

        String description,

        String reference,

        UUID processId,

        String processName,

        UUID processStepId,

        String processStepName,

        String status,

        String actionPriority
) {
}