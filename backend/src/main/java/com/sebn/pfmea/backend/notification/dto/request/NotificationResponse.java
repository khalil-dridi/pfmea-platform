package com.sebn.pfmea.backend.notification.dto.request;

import com.sebn.pfmea.backend.notification.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String relatedEntityType,
        UUID relatedEntityId,
        boolean read,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {}
