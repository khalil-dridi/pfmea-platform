package com.sebn.pfmea.backend.ai.controller;

import com.sebn.pfmea.backend.ai.dto.request.AiConversationCreateRequest;
import com.sebn.pfmea.backend.ai.dto.request.AiMessageRequest;
import com.sebn.pfmea.backend.ai.dto.response.AiMessageResponse;
import com.sebn.pfmea.backend.ai.dto.response.ConversationStartResponse;
import com.sebn.pfmea.backend.ai.service.PfmeaConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
public class PfmeaConversationController {

    private final PfmeaConversationService pfmeaConversationService;

    @GetMapping("/start")
    public ConversationStartResponse startConversation(
            @RequestParam UUID processId,
            @RequestParam UUID processStepId
    ) {
        return pfmeaConversationService.startConversation(
                processId,
                processStepId
        );
    }

    @PostMapping("/{conversationId}/messages")
    public AiMessageResponse sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody AiMessageRequest request
    ) {
        return pfmeaConversationService.sendMessage(
                conversationId,
                request.message()
        );
    }

    @PostMapping
    public ConversationStartResponse createConversation(
            @Valid @RequestBody AiConversationCreateRequest request
    ) {
        return pfmeaConversationService.startConversation(
                request.processId(),
                request.processStepId()
        );
    }

    @DeleteMapping("/{conversationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetConversation(
            @PathVariable UUID conversationId
    ) {
        pfmeaConversationService.resetConversation(
                conversationId
        );
    }
}