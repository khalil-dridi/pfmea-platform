package com.sebn.pfmea.backend.ai.controller;


import com.sebn.pfmea.backend.ai.dto.response.AiPromptPreviewResponse;
import com.sebn.pfmea.backend.ai.service.AiPromptPreviewService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiPromptPreviewController {

    private final AiPromptPreviewService aiPromptPreviewService;

    @GetMapping("/prompt-preview")
    public AiPromptPreviewResponse previewPrompt(
            @RequestParam UUID processId,
            @RequestParam UUID processStepId
    ) {
        return aiPromptPreviewService.buildPromptPreview(
                processId,
                processStepId
        );
    }
}
