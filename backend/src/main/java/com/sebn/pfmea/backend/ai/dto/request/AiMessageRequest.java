package com.sebn.pfmea.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AiMessageRequest(
        @NotBlank
        String message
) {
}
