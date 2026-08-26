package com.sebn.pfmea.backend.ai.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AiConversationCreateRequest(
        @NotNull
        UUID processId,

        @NotNull
        UUID processStepId
) {
}
