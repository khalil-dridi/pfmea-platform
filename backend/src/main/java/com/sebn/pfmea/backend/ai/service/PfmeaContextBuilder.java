package com.sebn.pfmea.backend.ai.service;

import com.sebn.pfmea.backend.ai.context.*;
import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import com.sebn.pfmea.backend.failureCause.repository.FailureCauseRepository;
import com.sebn.pfmea.backend.failureEffect.entity.FailureEffect;
import com.sebn.pfmea.backend.failureEffect.repository.FailureEffectRepository;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
import com.sebn.pfmea.backend.function.entity.Function;
import com.sebn.pfmea.backend.function.repository.FunctionRepository;
import com.sebn.pfmea.backend.optimization.entity.Optimization;
import com.sebn.pfmea.backend.optimization.entity.OptimizationAction;
import com.sebn.pfmea.backend.optimization.repository.OptimizationActionRepository;
import com.sebn.pfmea.backend.optimization.repository.OptimizationRepository;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import com.sebn.pfmea.backend.processWorkElement.repository.ProcessWorkElementRepository;
import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import com.sebn.pfmea.backend.riskAnalysis.repository.RiskAnalysisRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PfmeaContextBuilder {

    private final ProcessRepository processRepository;
    private final ProcessStepRepository processStepRepository;
    private final ProcessWorkElementRepository processWorkElementRepository;
    private final FunctionRepository functionRepository;
    private final FailureModeRepository failureModeRepository;
    private final FailureEffectRepository failureEffectRepository;
    private final FailureCauseRepository failureCauseRepository;
    private final RiskAnalysisRepository riskAnalysisRepository;
    private final OptimizationRepository optimizationRepository;
    private final OptimizationActionRepository optimizationActionRepository;

    @Transactional(readOnly = true)
    public PfmeaProcessContext build(
            UUID processId,
            UUID processStepId
    ) {

        Process process = processRepository.findById(processId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process not found with id: " + processId
                        )
                );

        ProcessStep processStep = processStepRepository
                .findById(processStepId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process step not found with id: "
                                        + processStepId
                        )
                );

        validateProcessStepBelongsToProcess(
                processStep,
                processId
        );

        /*
         * ---------------------------------------------------------
         * Load Process Step data
         * ---------------------------------------------------------
         */

        List<ProcessWorkElement> workElements =
                processWorkElementRepository
                        .findByProcessStepIdOrderByElementNumberAsc(
                                processStepId
                        );

        List<Function> functions =
                functionRepository.findAllForProcessStepScope(
                        processId,
                        processStepId
                );

        List<FailureMode> failureModes =
                failureModeRepository
                        .findByProcessStepIdOrderByFailureCodeAsc(
                                processStepId
                        );

        /*
         * ---------------------------------------------------------
         * Failure Modes
         * ---------------------------------------------------------
         */

        List<UUID> failureModeIds =
                failureModes.stream()
                        .map(FailureMode::getId)
                        .toList();

        List<FailureEffect> failureEffects =
                failureModeIds.isEmpty()
                        ? List.of()
                        : failureEffectRepository
                        .findByFailureModeIdIn(
                                failureModeIds
                        );

        List<FailureCause> failureCauses =
                failureModeIds.isEmpty()
                        ? List.of()
                        : failureCauseRepository
                        .findByFailureModeIdInOrderByFailureModeIdAscIdAsc(
                                failureModeIds
                        );

        /*
         * ---------------------------------------------------------
         * Failure Causes
         * ---------------------------------------------------------
         */

        List<UUID> failureCauseIds =
                failureCauses.stream()
                        .map(FailureCause::getId)
                        .toList();

        List<RiskAnalysis> riskAnalyses =
                failureCauseIds.isEmpty()
                        ? List.of()
                        : riskAnalysisRepository
                        .findByFailureCauseIdIn(
                                failureCauseIds
                        );

        /*
         * ---------------------------------------------------------
         * Risk Analyses
         * ---------------------------------------------------------
         */

        List<UUID> riskAnalysisIds =
                riskAnalyses.stream()
                        .map(RiskAnalysis::getId)
                        .toList();

        List<Optimization> optimizations =
                riskAnalysisIds.isEmpty()
                        ? List.of()
                        : optimizationRepository
                        .findByRiskAnalysisIdIn(
                                riskAnalysisIds
                        );

        /*
         * ---------------------------------------------------------
         * Optimizations
         * ---------------------------------------------------------
         */

        List<UUID> optimizationIds =
                optimizations.stream()
                        .map(Optimization::getId)
                        .toList();

        List<OptimizationAction> optimizationActions =
                optimizationIds.isEmpty()
                        ? List.of()
                        : optimizationActionRepository
                        .findByOptimizationIdInOrderByTargetCompletionDateAsc(
                                optimizationIds
                        );

        /*
         * ---------------------------------------------------------
         * Build lookup maps
         * ---------------------------------------------------------
         */

        Map<UUID, FailureEffect> effectsByFailureModeId =
                failureEffects.stream()
                        .collect(
                                Collectors.toMap(
                                        effect ->
                                                effect.getFailureMode().getId(),
                                        effect -> effect
                                )
                        );
        Map<UUID, List<FailureCause>> causesByFailureModeId =
                failureCauses.stream()
                        .collect(
                                Collectors.groupingBy(
                                        cause ->
                                                cause.getFailureMode().getId()
                                )
                        );

        Map<UUID, RiskAnalysis> riskAnalysesByFailureCauseId =
                riskAnalyses.stream()
                        .collect(
                                Collectors.toMap(
                                        riskAnalysis ->
                                                riskAnalysis
                                                        .getFailureCause()
                                                        .getId(),
                                        riskAnalysis -> riskAnalysis
                                )
                        );

        Map<UUID, Optimization> optimizationsByRiskAnalysisId =
                optimizations.stream()
                        .collect(
                                Collectors.toMap(
                                        optimization ->
                                                optimization
                                                        .getRiskAnalysis()
                                                        .getId(),
                                        optimization -> optimization
                                )
                        );

        Map<UUID, List<OptimizationAction>> actionsByOptimizationId =
                optimizationActions.stream()
                        .collect(
                                Collectors.groupingBy(
                                        action ->
                                                action.getOptimization()
                                                        .getId()
                                )
                        );

        /*
         * ---------------------------------------------------------
         * Build Context DTOs
         * ---------------------------------------------------------
         */

        List<PfmeaWorkElementContext> workElementContexts =
                workElements.stream()
                        .map(this::toWorkElementContext)
                        .toList();

        List<PfmeaFunctionContext> functionContexts =
                functions.stream()
                        .map(this::toFunctionContext)
                        .toList();

        List<PfmeaFailureModeContext> failureModeContexts =
                failureModes.stream()
                        .map(failureMode ->
                                toFailureModeContext(
                                        failureMode,
                                        effectsByFailureModeId,
                                        causesByFailureModeId,
                                        riskAnalysesByFailureCauseId,
                                        optimizationsByRiskAnalysisId,
                                        actionsByOptimizationId
                                )
                        )
                        .toList();

        /*
         * ---------------------------------------------------------
         * Process Step Context
         * ---------------------------------------------------------
         */

        PfmeaProcessStepContext processStepContext =
                new PfmeaProcessStepContext(
                        processStep.getId(),
                        processStep.getProcess().getId(),
                        processStep.getStepNumber(),
                        processStep.getName(),
                        processStep.getDescription(),
                        workElementContexts,
                        functionContexts,
                        failureModeContexts
                );

        /*
         * ---------------------------------------------------------
         * Process Context
         * ---------------------------------------------------------
         */

        return new PfmeaProcessContext(
                process.getId(),
                process.getName(),
                process.getProcessNumber(),
                List.of(processStepContext)
        );
    }

    private void validateProcessStepBelongsToProcess(
            ProcessStep processStep,
            UUID processId
    ) {
        if (!processStep.getProcess().getId().equals(processId)) {
            throw new IllegalArgumentException(
                    "The selected process step does not belong "
                            + "to the selected process."
            );
        }
    }

    private PfmeaWorkElementContext toWorkElementContext(
            ProcessWorkElement workElement
    ) {
        return new PfmeaWorkElementContext(
                workElement.getId(),
                workElement.getElementNumber(),
                workElement.getName(),
                workElement.getDescription()
        );
    }

    private PfmeaFunctionContext toFunctionContext(
            Function function
    ) {
        return new PfmeaFunctionContext(
                function.getId(),
                function.getType(),
                function.getDescription(),
                function.getProcess() != null
                        ? function.getProcess().getId()
                        : null,
                function.getProcessStep() != null
                        ? function.getProcessStep().getId()
                        : null,
                function.getWorkElement() != null
                        ? function.getWorkElement().getId()
                        : null
        );
    }

    private PfmeaFailureModeContext toFailureModeContext(
            FailureMode failureMode,
            Map<UUID, FailureEffect> effectsByFailureModeId,
            Map<UUID, List<FailureCause>> causesByFailureModeId,
            Map<UUID, RiskAnalysis> riskAnalysesByFailureCauseId,
            Map<UUID, Optimization> optimizationsByRiskAnalysisId,
            Map<UUID, List<OptimizationAction>> actionsByOptimizationId
    ) {
        FailureEffect failureEffect =
                effectsByFailureModeId.get(
                        failureMode.getId()
                );

        PfmeaFailureEffectContext failureEffectContext =
                failureEffect == null
                        ? null
                        : new PfmeaFailureEffectContext(
                        failureEffect.getId(),
                        failureEffect.getFailureMode().getId(),
                        failureEffect.getOurPlant(),
                        failureEffect.getShipToPlant(),
                        failureEffect.getEndUser(),
                        failureEffect.getSeverity()
                );

        List<FailureCause> failureCauses =
                causesByFailureModeId.getOrDefault(
                        failureMode.getId(),
                        List.of()
                );

        List<PfmeaFailureCauseContext> failureCauseContexts =
                failureCauses.stream()
                        .map(failureCause ->
                                toFailureCauseContext(
                                        failureCause,
                                        riskAnalysesByFailureCauseId,
                                        optimizationsByRiskAnalysisId,
                                        actionsByOptimizationId
                                )
                        )
                        .toList();

        return new PfmeaFailureModeContext(
                failureMode.getId(),
                failureMode.getProcessStep().getId(),
                failureMode.getDescription(),
                failureMode.getFailureCode(),
                failureEffectContext,
                failureCauseContexts
        );
    }

    private PfmeaFailureCauseContext toFailureCauseContext(
            FailureCause failureCause,
            Map<UUID, RiskAnalysis> riskAnalysesByFailureCauseId,
            Map<UUID, Optimization> optimizationsByRiskAnalysisId,
            Map<UUID, List<OptimizationAction>> actionsByOptimizationId
    ) {
        RiskAnalysis riskAnalysis =
                riskAnalysesByFailureCauseId.get(
                        failureCause.getId()
                );

        PfmeaRiskAnalysisContext riskAnalysisContext =
                riskAnalysis == null
                        ? null
                        : new PfmeaRiskAnalysisContext(
                        riskAnalysis.getId(),
                        riskAnalysis.getFailureCause().getId(),
                        riskAnalysis.getCurrentPreventionControl(),
                        riskAnalysis.getOccurrence(),
                        riskAnalysis.getCurrentDetectionControl(),
                        riskAnalysis.getDetection(),
                        riskAnalysis.getDetectionScope(),
                        riskAnalysis.getActionPriority(),
                        riskAnalysis.getSpecialProcess(),
                        riskAnalysis.getSpecialCharacteristic()
                );

        PfmeaOptimizationContext optimizationContext = null;

        if (riskAnalysis != null) {

            Optimization optimization =
                    optimizationsByRiskAnalysisId.get(
                            riskAnalysis.getId()
                    );

            if (optimization != null) {

                List<PfmeaOptimizationActionContext> actionContexts =
                        actionsByOptimizationId.getOrDefault(
                                        optimization.getId(),
                                        List.of()
                                )
                                .stream()
                                .map(this::toOptimizationActionContext)
                                .toList();

                optimizationContext =
                        new PfmeaOptimizationContext(
                                optimization.getId(),
                                optimization.getRiskAnalysis().getId(),
                                optimization.getSeverity(),
                                optimization.getOccurrence(),
                                optimization.getDetection(),
                                optimization.getActionPriority(),
                                optimization.getSpecialProcess(),
                                optimization.getSpecialCharacteristic(),
                                optimization.getRemarks(),
                                actionContexts
                        );
            }
        }

        return new PfmeaFailureCauseContext(
                failureCause.getId(),
                failureCause.getFailureMode().getId(),
                failureCause.getDescription(),
                riskAnalysisContext,
                optimizationContext
        );
    }

    private PfmeaOptimizationActionContext toOptimizationActionContext(
            OptimizationAction action
    ) {
        return new PfmeaOptimizationActionContext(
                action.getId(),
                action.getOptimization().getId(),
                action.getActionType(),
                action.getDescription(),
                action.getResponsiblePerson(),
                action.getTargetCompletionDate(),
                action.getStatus(),
                action.getEvidence(),
                action.getCompletionDate()
        );
    }
}
