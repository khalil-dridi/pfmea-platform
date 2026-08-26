package com.sebn.pfmea.backend.ai.service;

import com.google.genai.types.GenerateContentResponse;
import com.sebn.pfmea.backend.ai.dto.response.AiMessageResponse;
import com.sebn.pfmea.backend.ai.service.PfmeaContextBuilder;
import com.sebn.pfmea.backend.ai.context.PfmeaProcessContext;
import com.sebn.pfmea.backend.ai.dto.response.ConversationStartResponse;
import com.sebn.pfmea.backend.ai.prompt.PfmeaPromptBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PfmeaConversationService {

    private final GeminiConversationManager conversationManager;
    private final PfmeaContextBuilder pfmeaContextBuilder;
    private final PfmeaPromptBuilder pfmeaPromptBuilder;

    public ConversationStartResponse startConversation(
            UUID processId,
            UUID processStepId
    ) {

        PfmeaProcessContext context =
                pfmeaContextBuilder.build(
                        processId,
                        processStepId
                );

        String fullPrompt =
                pfmeaPromptBuilder.buildFullPrompt(
                        context
                );

        UUID conversationId =
                conversationManager.createConversation(
                        processId,
                        processStepId
                );

        GeminiConversationManager.ConversationSession session =
                conversationManager.getConversation(
                        conversationId
                );

        GenerateContentResponse response =
                session.chat().sendMessage(
                        fullPrompt
                );

        return new ConversationStartResponse(
                conversationId,
                processId,
                processStepId,
                response.text()
        );
    }
    public AiMessageResponse sendMessage(
            UUID conversationId,
            String message
    ) {
        GeminiConversationManager.ConversationSession session =
                conversationManager.getConversation(
                        conversationId
                );

        GenerateContentResponse response =
                session.chat().sendMessage(message);

        return new AiMessageResponse(
                conversationId,
                response.text()
        );
    }

    public void resetConversation(UUID conversationId) {
        conversationManager.removeConversation(conversationId);
    }
}