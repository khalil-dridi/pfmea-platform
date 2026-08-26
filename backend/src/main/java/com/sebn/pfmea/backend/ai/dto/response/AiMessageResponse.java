package com.sebn.pfmea.backend.ai.dto.response;

import java.util.UUID;

public record AiMessageResponse(
        UUID conversationId,
        String message
) {
}