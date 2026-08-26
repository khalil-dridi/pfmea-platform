package com.sebn.pfmea.backend.ai.service;

import com.google.genai.Chat;
import com.google.genai.Client;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class GeminiConversationManager {

    private final Client geminiClient;

    private final ConcurrentMap<UUID, ConversationSession> conversations =
            new ConcurrentHashMap<>();

    public UUID createConversation(
            UUID processId,
            UUID processStepId
    ) {
        Chat chat =
                geminiClient.chats.create(
                        "gemini-3.6-flash"
                );

        UUID conversationId = UUID.randomUUID();

        ConversationSession session =
                new ConversationSession(
                        conversationId,
                        processId,
                        processStepId,
                        chat
                );

        conversations.put(
                conversationId,
                session
        );

        return conversationId;
    }

    public ConversationSession getConversation(
            UUID conversationId
    ) {
        ConversationSession session =
                conversations.get(conversationId);

        if (session == null) {
            throw new IllegalArgumentException(
                    "AI conversation not found: "
                            + conversationId
            );
        }

        return session;
    }

    public void removeConversation(
            UUID conversationId
    ) {
        conversations.remove(
                conversationId
        );
    }

    public static class ConversationSession {

        private final UUID conversationId;
        private final UUID processId;
        private final UUID processStepId;
        private final Chat chat;

        public ConversationSession(
                UUID conversationId,
                UUID processId,
                UUID processStepId,
                Chat chat
        ) {
            this.conversationId = conversationId;
            this.processId = processId;
            this.processStepId = processStepId;
            this.chat = chat;
        }

        public UUID conversationId() {
            return conversationId;
        }

        public UUID processId() {
            return processId;
        }

        public UUID processStepId() {
            return processStepId;
        }

        public Chat chat() {
            return chat;
        }
    }
}