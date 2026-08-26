package com.sebn.pfmea.backend.ai.service;

import com.google.genai.Chat;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeminiTestService {

    private final Client geminiClient;

    public String testMultiTurnConversation() {

        Chat chatSession =
                geminiClient.chats.create(
                        "gemini-3.6-flash"
                );

        GenerateContentResponse firstResponse =
                chatSession.sendMessage(
                        "My name is P-FMEA Assistant Test."
                );

        GenerateContentResponse secondResponse =
                chatSession.sendMessage(
                        "What is my name?"
                );

        return """
                FIRST RESPONSE:
                %s

                SECOND RESPONSE:
                %s
                """.formatted(
                firstResponse.text(),
                secondResponse.text()
        );
    }
}