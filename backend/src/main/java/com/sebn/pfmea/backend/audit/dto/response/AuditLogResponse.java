package com.sebn.pfmea.backend.audit.dto.response;

import com.sebn.pfmea.backend.audit.enums.AuditAction;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String entityType,
        UUID entityId,
        AuditAction action,
        String oldData,
        String newData,
        UUID performedById,
        String performedByName,
        LocalDateTime createdAt
) {
}