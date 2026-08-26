package com.sebn.pfmea.backend.ai.service;


import com.sebn.pfmea.backend.ai.context.PfmeaProcessContext;
import com.sebn.pfmea.backend.ai.dto.response.AiPromptPreviewResponse;
import com.sebn.pfmea.backend.ai.prompt.PfmeaPromptBuilder;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiPromptPreviewService {

    private final PfmeaContextBuilder pfmeaContextBuilder;
    private final PfmeaPromptBuilder pfmeaPromptBuilder;

    public AiPromptPreviewResponse buildPromptPreview(
            UUID processId,
            UUID processStepId
    ) {
        PfmeaProcessContext context =
                pfmeaContextBuilder.build(
                        processId,
                        processStepId
                );

        String systemPrompt =
                pfmeaPromptBuilder.buildSystemPrompt();

        String pfmeaContext =
                pfmeaPromptBuilder.buildContext(
                        context
                );

        String fullPrompt =
                pfmeaPromptBuilder.buildFullPrompt(
                        context
                );

        return new AiPromptPreviewResponse(
                systemPrompt,
                pfmeaContext,
                fullPrompt
        );
    }
}
