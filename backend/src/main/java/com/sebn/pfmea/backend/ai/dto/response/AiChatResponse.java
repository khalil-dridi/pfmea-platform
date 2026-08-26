package com.sebn.pfmea.backend.ai.dto.response;

import java.util.UUID;

public record AiChatResponse(
        UUID conversationId,
        String message
) {
}
