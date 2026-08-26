package com.sebn.pfmea.backend.ai.context;

import java.util.List;
import java.util.UUID;

public record PfmeaContext(
        UUID processId,
        UUID processStepId,
        String processName,
        String processNumber,
        Integer stepNumber,
        String processStepName,
        String processStepDescription,
        List<PfmeaWorkElementContext> workElements,
        List<PfmeaFunctionContext> functions,
        List<PfmeaFailureModeContext> failureModes,
        List<PfmeaFailureEffectContext> failureEffects,
        List<PfmeaFailureCauseContext> failureCauses,
        List<PfmeaRiskAnalysisContext> riskAnalyses,
        List<PfmeaOptimizationContext> optimizations,
        List<PfmeaOptimizationActionContext> optimizationActions
) {
}