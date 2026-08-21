package com.sebn.pfmea.backend.change.dto.response;

import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record ChangeRequestResponse(
        UUID id,
        String entityType,
        UUID entityId,
        ChangeRequestOperation operation,
        String oldData,
        String newData,
        UUID requestedById,
        String requestedByName,
        ChangeRequestStatus status,
        UUID reviewedById,
        String reviewedByName,
        String reviewComment,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
}