package com.sebn.pfmea.backend.ai.controller;

import com.sebn.pfmea.backend.ai.service.GeminiTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/test")
@RequiredArgsConstructor
public class GeminiTestController {

    private final GeminiTestService geminiTestService;

    @GetMapping("/conversation")
    public String testConversation() {
        return geminiTestService.testMultiTurnConversation();
    }
}