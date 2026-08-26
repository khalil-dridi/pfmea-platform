package com.sebn.pfmea.backend.ai.prompt;

import com.sebn.pfmea.backend.ai.context.PfmeaFailureCauseContext;
import com.sebn.pfmea.backend.ai.context.PfmeaFailureEffectContext;
import com.sebn.pfmea.backend.ai.context.PfmeaFailureModeContext;
import com.sebn.pfmea.backend.ai.context.PfmeaFunctionContext;
import com.sebn.pfmea.backend.ai.context.PfmeaOptimizationActionContext;
import com.sebn.pfmea.backend.ai.context.PfmeaOptimizationContext;
import com.sebn.pfmea.backend.ai.context.PfmeaProcessContext;
import com.sebn.pfmea.backend.ai.context.PfmeaProcessStepContext;
import com.sebn.pfmea.backend.ai.context.PfmeaRiskAnalysisContext;
import com.sebn.pfmea.backend.ai.context.PfmeaWorkElementContext;
import org.springframework.stereotype.Component;

@Component
public class PfmeaPromptBuilder {

    public String buildSystemPrompt() {
        return """
                You are the P-FMEA AI Assistant of the SEBN TN P-FMEA Platform.

                ROLE
                You are an engineering assistant specialized in Process
                Failure Mode and Effects Analysis (P-FMEA).

                Your role is to help engineers understand, analyze and
                improve the P-FMEA data provided by the platform.

                RULES

                1. Use only the P-FMEA information provided in the context.
                2. Never invent P-FMEA data.
                3. Never assume a value that is not explicitly provided.
                4. If information is missing, clearly state that it is not
                   available in the current P-FMEA scope.
                5. Distinguish clearly between:
                   - FACTS: information directly provided by the P-FMEA data.
                   - ANALYSIS: conclusions derived from the provided data.
                   - RECOMMENDATIONS: suggestions made by the AI.
                6. When discussing risks, use the actual Risk Analysis values.
                7. When discussing optimization, distinguish between the
                   current Risk Analysis and the Optimized Risk.
                8. When discussing actions, use the actual Optimization
                   Action data.
                9. Never modify, create, delete, approve or reject P-FMEA data.
                10. You are a READ-ONLY assistant.
                11. Never claim that an action was performed in the platform.
                12. Keep the selected Process and Process Step as the
                    current analysis scope.
                13. Never use information from another Process or
                    Process Step.
                14. Answer in a professional engineering style.
                15. Prefer concise and structured answers.
                16. Use tables or bullet points when they improve clarity.
                17. If a question is ambiguous, ask for clarification.
                18. If a question is unrelated to P-FMEA, explain that you
                    are specialized in the P-FMEA platform.

                The P-FMEA context provided with the conversation is the
                source of truth.
                """;
    }

    public String buildContext(PfmeaProcessContext processContext) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("""
                ==================================================
                P-FMEA CONTEXT
                ==================================================

                """);

        appendProcess(prompt, processContext);

        return prompt.toString();
    }

    public String buildInitializationMessage(
            PfmeaProcessContext processContext
    ) {
        PfmeaProcessStepContext step =
                processContext.processSteps().get(0);

        return """
                ==================================================
                CONVERSATION INITIALIZATION
                ==================================================

                The P-FMEA context has been loaded successfully.

                Current scope:

                Process: %s
                Process Step: Step %s - %s

                You are now ready to assist the engineer.

                Respond with a short confirmation only.
                Do not summarize the entire P-FMEA context unless requested.
                """.formatted(
                processContext.name(),
                step.stepNumber(),
                step.name()
        );
    }

    public String buildFullPrompt(
            PfmeaProcessContext processContext
    ) {
        return buildSystemPrompt()
                + "\n\n"
                + buildContext(processContext)
                + "\n\n"
                + buildInitializationMessage(processContext);
    }

    private void appendProcess(
            StringBuilder prompt,
            PfmeaProcessContext processContext
    ) {
        prompt.append("""
                PROCESS
                --------------------------------------------------
                ID: %s
                Name: %s
                Process Number: %s

                """.formatted(
                processContext.id(),
                safe(processContext.name()),
                safe(processContext.processNumber())
        ));

        for (PfmeaProcessStepContext step
                : processContext.processSteps()) {

            appendProcessStep(prompt, step);
        }
    }

    private void appendProcessStep(
            StringBuilder prompt,
            PfmeaProcessStepContext step
    ) {
        prompt.append("""
                PROCESS STEP
                --------------------------------------------------
                ID: %s
                Step Number: %s
                Name: %s
                Description: %s

                """.formatted(
                step.id(),
                step.stepNumber(),
                safe(step.name()),
                safe(step.description())
        ));

        appendWorkElements(prompt, step);
        appendFunctions(prompt, step);
        appendFailureModes(prompt, step);
    }

    private void appendWorkElements(
            StringBuilder prompt,
            PfmeaProcessStepContext step
    ) {
        prompt.append("""
                WORK ELEMENTS
                --------------------------------------------------
                """);

        if (step.workElements().isEmpty()) {
            prompt.append("No work elements are defined.\n\n");
            return;
        }

        for (PfmeaWorkElementContext workElement
                : step.workElements()) {

            prompt.append("""
                    Work Element
                    ID: %s
                    Element Number: %s
                    Name: %s
                    Description: %s

                    """.formatted(
                    workElement.id(),
                    workElement.elementNumber(),
                    safe(workElement.name()),
                    safe(workElement.description())
            ));
        }
    }

    private void appendFunctions(
            StringBuilder prompt,
            PfmeaProcessStepContext step
    ) {
        prompt.append("""
                FUNCTIONS
                --------------------------------------------------
                """);

        if (step.functions().isEmpty()) {
            prompt.append("No functions are defined.\n\n");
            return;
        }

        for (PfmeaFunctionContext function
                : step.functions()) {

            prompt.append("""
                    Function
                    ID: %s
                    Type: %s
                    Description: %s
                    Process ID: %s
                    Process Step ID: %s
                    Work Element ID: %s

                    """.formatted(
                    function.id(),
                    function.type(),
                    safe(function.description()),
                    function.processId(),
                    function.processStepId(),
                    function.workElementId()
            ));
        }
    }

    private void appendFailureModes(
            StringBuilder prompt,
            PfmeaProcessStepContext step
    ) {
        prompt.append("""
                FAILURE MODES
                ==================================================
                """);

        if (step.failureModes().isEmpty()) {
            prompt.append("No failure modes are defined.\n\n");
            return;
        }

        for (PfmeaFailureModeContext failureMode
                : step.failureModes()) {

            appendFailureMode(
                    prompt,
                    failureMode
            );
        }
    }

    private void appendFailureMode(
            StringBuilder prompt,
            PfmeaFailureModeContext failureMode
    ) {
        prompt.append("""
                
                FAILURE MODE
                --------------------------------------------------
                ID: %s
                Process Step ID: %s
                Description: %s
                Failure Code: %s

                """.formatted(
                failureMode.id(),
                failureMode.processStepId(),
                safe(failureMode.description()),
                safe(failureMode.failureCode())
        ));

        appendFailureEffect(
                prompt,
                failureMode.failureEffect()
        );

        appendFailureCauses(
                prompt,
                failureMode
        );
    }

    private void appendFailureEffect(
            StringBuilder prompt,
            PfmeaFailureEffectContext effect
    ) {
        prompt.append("FAILURE EFFECT\n");
        prompt.append("--------------------------------------------------\n");

        if (effect == null) {
            prompt.append("No failure effect is defined.\n\n");
            return;
        }

        prompt.append("""
                ID: %s
                Failure Mode ID: %s
                Our Plant: %s
                Ship To Plant: %s
                End User: %s
                Severity: %s

                """.formatted(
                effect.id(),
                effect.failureModeId(),
                safe(effect.ourPlant()),
                safe(effect.shipToPlant()),
                safe(effect.endUser()),
                effect.severity()
        ));
    }

    private void appendFailureCauses(
            StringBuilder prompt,
            PfmeaFailureModeContext failureMode
    ) {
        prompt.append("FAILURE CAUSES\n");
        prompt.append("--------------------------------------------------\n");

        if (failureMode.failureCauses().isEmpty()) {
            prompt.append("No failure causes are defined.\n\n");
            return;
        }

        for (PfmeaFailureCauseContext cause
                : failureMode.failureCauses()) {

            prompt.append("""
                    Failure Cause
                    ID: %s
                    Failure Mode ID: %s
                    Description: %s

                    """.formatted(
                    cause.id(),
                    cause.failureModeId(),
                    safe(cause.description())
            ));

            appendRiskAnalysis(
                    prompt,
                    cause.riskAnalysis()
            );

            appendOptimization(
                    prompt,
                    cause.optimization()
            );
        }
    }

    private void appendRiskAnalysis(
            StringBuilder prompt,
            PfmeaRiskAnalysisContext riskAnalysis
    ) {
        prompt.append("RISK ANALYSIS\n");
        prompt.append("--------------------------------------------------\n");

        if (riskAnalysis == null) {
            prompt.append("No risk analysis is defined.\n\n");
            return;
        }

        prompt.append("""
                ID: %s
                Failure Cause ID: %s
                Current Prevention Control: %s
                Occurrence: %s
                Current Detection Control: %s
                Detection: %s
                Detection Scope: %s
                Action Priority: %s
                Special Process: %s
                Special Characteristic: %s

                """.formatted(
                riskAnalysis.id(),
                riskAnalysis.failureCauseId(),
                safe(riskAnalysis.currentPreventionControl()),
                riskAnalysis.occurrence(),
                safe(riskAnalysis.currentDetectionControl()),
                riskAnalysis.detection(),
                riskAnalysis.detectionScope(),
                riskAnalysis.actionPriority(),
                safe(riskAnalysis.specialProcess()),
                safe(riskAnalysis.specialCharacteristic())
        ));
    }

    private void appendOptimization(
            StringBuilder prompt,
            PfmeaOptimizationContext optimization
    ) {
        prompt.append("OPTIMIZATION\n");
        prompt.append("--------------------------------------------------\n");

        if (optimization == null) {
            prompt.append("No optimization is defined.\n\n");
            return;
        }

        prompt.append("""
                ID: %s
                Risk Analysis ID: %s
                Severity: %s
                Occurrence: %s
                Detection: %s
                Action Priority: %s
                Special Process: %s
                Special Characteristic: %s
                Remarks: %s

                """.formatted(
                optimization.id(),
                optimization.riskAnalysisId(),
                optimization.severity(),
                optimization.occurrence(),
                optimization.detection(),
                optimization.actionPriority(),
                safe(optimization.specialProcess()),
                safe(optimization.specialCharacteristic()),
                safe(optimization.remarks())
        ));

        appendOptimizationActions(
                prompt,
                optimization
        );
    }

    private void appendOptimizationActions(
            StringBuilder prompt,
            PfmeaOptimizationContext optimization
    ) {
        prompt.append("OPTIMIZATION ACTIONS\n");
        prompt.append("--------------------------------------------------\n");

        if (optimization.actions().isEmpty()) {
            prompt.append("No optimization actions are defined.\n\n");
            return;
        }

        for (PfmeaOptimizationActionContext action
                : optimization.actions()) {

            prompt.append("""
                    Action
                    ID: %s
                    Optimization ID: %s
                    Type: %s
                    Description: %s
                    Responsible Person: %s
                    Target Completion Date: %s
                    Status: %s
                    Evidence: %s
                    Completion Date: %s

                    """.formatted(
                    action.id(),
                    action.optimizationId(),
                    action.actionType(),
                    safe(action.description()),
                    safe(action.responsiblePerson()),
                    action.targetCompletionDate(),
                    action.status(),
                    safe(action.evidence()),
                    action.completionDate()
            ));
        }
    }

    private String safe(String value) {
        return value == null || value.isBlank()
                ? "Not provided"
                : value;
    }
}
