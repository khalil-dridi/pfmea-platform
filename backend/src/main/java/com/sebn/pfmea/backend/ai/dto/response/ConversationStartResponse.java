package com.sebn.pfmea.backend.ai.dto.response;

import java.util.UUID;

public record ConversationStartResponse(
        UUID conversationId,
        UUID processId,
        UUID processStepId,
        String message
) {
}