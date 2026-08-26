package com.sebn.pfmea.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AiChatRequest(

        @NotBlank
        String message,

        @NotNull
        UUID processId,

        UUID processStepId,

        UUID conversationId
) {
}
