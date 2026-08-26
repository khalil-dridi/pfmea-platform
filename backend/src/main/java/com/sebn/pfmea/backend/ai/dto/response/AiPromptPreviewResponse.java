package com.sebn.pfmea.backend.ai.dto.response;

public record AiPromptPreviewResponse(
        String systemPrompt,
        String pfmeaContext,
        String fullPrompt
) {
}
