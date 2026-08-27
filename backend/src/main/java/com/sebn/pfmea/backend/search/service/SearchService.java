package com.sebn.pfmea.backend.search.service;

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
import com.sebn.pfmea.backend.search.dto.request.SearchRequest;
import com.sebn.pfmea.backend.search.dto.response.SearchResponse;
import com.sebn.pfmea.backend.search.dto.response.SearchResultResponse;
import com.sebn.pfmea.backend.search.enums.SearchEntityType;
import com.sebn.pfmea.backend.search.projection.GlobalSearchProjection;
import com.sebn.pfmea.backend.search.repository.GlobalSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;

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
    private final GlobalSearchRepository globalSearchRepository;

    public SearchResponse search(SearchRequest request) {

        int page = request.page() == null
                ? DEFAULT_PAGE
                : request.page();

        int size = request.size() == null
                ? DEFAULT_SIZE
                : request.size();

        Pageable pageable =
                PageRequest.of(page, size);

        if (request.entityType() == null) {

            String query = normalizeQuery(request.q());

            Page<GlobalSearchProjection> result =
                    globalSearchRepository.searchGlobal(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toGlobalSearchResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.PROCESS) {

            String query = normalizeQuery(request.q());

            Page<Process> result =
                    processRepository
                            .findByNameContainingIgnoreCaseOrProcessNumberContainingIgnoreCase(
                                    query,
                                    query,
                                    pageable
                            );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toProcessResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.PROCESS_STEP) {

            String query = normalizeQuery(request.q());

            Page<ProcessStep> result =
                    processStepRepository.search(
                            request.processId(),
                            query,
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toProcessStepResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.WORK_ELEMENT) {

            String query = normalizeQuery(request.q());

            Page<ProcessWorkElement> result =
                    processWorkElementRepository.search(
                            request.processStepId(),
                            query,
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toWorkElementResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.FUNCTION) {

            String query = normalizeQuery(request.q());

            Page<Function> result =
                    functionRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toFunctionResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.FAILURE_MODE) {

            String query = normalizeQuery(request.q());

            Page<FailureMode> result =
                    failureModeRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toFailureModeResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.FAILURE_EFFECT) {

            String query = normalizeQuery(request.q());

            Page<FailureEffect> result =
                    failureEffectRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toFailureEffectResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.FAILURE_CAUSE) {

            String query = normalizeQuery(request.q());

            Page<FailureCause> result =
                    failureCauseRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toFailureCauseResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.RISK_ANALYSIS) {

            String query = normalizeQuery(request.q());

            Page<RiskAnalysis> result =
                    riskAnalysisRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toRiskAnalysisResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.OPTIMIZATION) {

            String query = normalizeQuery(request.q());

            Page<Optimization> result =
                    optimizationRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toOptimizationResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        if (request.entityType() == SearchEntityType.OPTIMIZATION_ACTION) {

            String query = normalizeQuery(request.q());

            Page<OptimizationAction> result =
                    optimizationActionRepository.search(
                            query,
                            request.processId(),
                            request.processStepId(),
                            pageable
                    );

            return new SearchResponse(
                    result.getContent()
                            .stream()
                            .map(this::toOptimizationActionResult)
                            .toList(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages()
            );
        }

        throw new UnsupportedOperationException(
                "Search entity type not implemented yet: "
                        + request.entityType()
        );
    }

    private SearchResultResponse toProcessResult(
            Process process
    ) {
        return new SearchResultResponse(
                process.getId(),
                SearchEntityType.PROCESS,
                process.getName(),
                null,
                process.getProcessNumber(),
                process.getId(),
                process.getName(),
                null,
                null,
                null,
                null
        );
    }

    private SearchResultResponse toProcessStepResult(
            ProcessStep processStep
    ) {
        return new SearchResultResponse(
                processStep.getId(),
                SearchEntityType.PROCESS_STEP,
                processStep.getName(),
                processStep.getDescription(),
                String.valueOf(processStep.getStepNumber()),
                processStep.getProcess().getId(),
                processStep.getProcess().getName(),
                processStep.getId(),
                processStep.getName(),
                null,
                null
        );
    }
    private SearchResultResponse toWorkElementResult(
            ProcessWorkElement workElement
    ) {
        return new SearchResultResponse(
                workElement.getId(),
                SearchEntityType.WORK_ELEMENT,
                workElement.getName(),
                workElement.getDescription(),
                String.valueOf(workElement.getElementNumber()),
                workElement.getProcessStep().getProcess().getId(),
                workElement.getProcessStep().getProcess().getName(),
                workElement.getProcessStep().getId(),
                workElement.getProcessStep().getName(),
                null,
                null
        );
    }

    private SearchResultResponse toFunctionResult(
            Function function
    ) {
        UUID processId = null;
        String processName = null;
        UUID processStepId = null;
        String processStepName = null;

        if (function.getProcess() != null) {
            processId = function.getProcess().getId();
            processName = function.getProcess().getName();
        }

        if (function.getProcessStep() != null) {
            processStepId = function.getProcessStep().getId();
            processStepName = function.getProcessStep().getName();

            if (processId == null) {
                processId = function.getProcessStep()
                        .getProcess()
                        .getId();

                processName = function.getProcessStep()
                        .getProcess()
                        .getName();
            }
        }

        if (function.getWorkElement() != null) {
            processStepId = function.getWorkElement()
                    .getProcessStep()
                    .getId();

            processStepName = function.getWorkElement()
                    .getProcessStep()
                    .getName();

            if (processId == null) {
                processId = function.getWorkElement()
                        .getProcessStep()
                        .getProcess()
                        .getId();

                processName = function.getWorkElement()
                        .getProcessStep()
                        .getProcess()
                        .getName();
            }
        }

        return new SearchResultResponse(
                function.getId(),
                SearchEntityType.FUNCTION,
                function.getDescription(),
                function.getDescription(),
                function.getType().name(),
                processId,
                processName,
                processStepId,
                processStepName,
                null,
                null
        );
    }

    private SearchResultResponse toFailureModeResult(
            FailureMode failureMode
    ) {
        return new SearchResultResponse(
                failureMode.getId(),
                SearchEntityType.FAILURE_MODE,
                failureMode.getDescription(),
                failureMode.getDescription(),
                failureMode.getFailureCode(),
                failureMode.getProcessStep().getProcess().getId(),
                failureMode.getProcessStep().getProcess().getName(),
                failureMode.getProcessStep().getId(),
                failureMode.getProcessStep().getName(),
                null,
                null
        );
    }

    private SearchResultResponse toFailureEffectResult(
            FailureEffect failureEffect
    ) {
        return new SearchResultResponse(
                failureEffect.getId(),
                SearchEntityType.FAILURE_EFFECT,
                buildFailureEffectTitle(failureEffect),
                buildFailureEffectDescription(failureEffect),
                null,
                failureEffect.getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getId(),
                failureEffect.getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getName(),
                failureEffect.getFailureMode()
                        .getProcessStep()
                        .getId(),
                failureEffect.getFailureMode()
                        .getProcessStep()
                        .getName(),
                null,
                null
        );
    }

    private SearchResultResponse toFailureCauseResult(
            FailureCause failureCause
    ) {
        return new SearchResultResponse(
                failureCause.getId(),
                SearchEntityType.FAILURE_CAUSE,
                failureCause.getDescription(),
                failureCause.getDescription(),
                null,
                failureCause.getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getId(),
                failureCause.getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getName(),
                failureCause.getFailureMode()
                        .getProcessStep()
                        .getId(),
                failureCause.getFailureMode()
                        .getProcessStep()
                        .getName(),
                null,
                null
        );
    }

    private SearchResultResponse toRiskAnalysisResult(
            RiskAnalysis riskAnalysis
    ) {
        return new SearchResultResponse(
                riskAnalysis.getId(),
                SearchEntityType.RISK_ANALYSIS,
                buildRiskAnalysisTitle(riskAnalysis),
                buildRiskAnalysisDescription(riskAnalysis),
                riskAnalysis.getActionPriority().name(),
                riskAnalysis.getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getId(),
                riskAnalysis.getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getName(),
                riskAnalysis.getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getId(),
                riskAnalysis.getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getName(),
                null,
                riskAnalysis.getActionPriority().name()
        );
    }

    private SearchResultResponse toOptimizationResult(
            Optimization optimization
    ) {
        return new SearchResultResponse(
                optimization.getId(),
                SearchEntityType.OPTIMIZATION,
                "Optimization",
                buildOptimizationDescription(optimization),
                optimization.getActionPriority().name(),
                optimization.getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getId(),
                optimization.getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getName(),
                optimization.getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getId(),
                optimization.getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getName(),
                null,
                optimization.getActionPriority().name()
        );
    }

    private SearchResultResponse toOptimizationActionResult(
            OptimizationAction action
    ) {
        return new SearchResultResponse(
                action.getId(),
                SearchEntityType.OPTIMIZATION_ACTION,
                action.getDescription(),
                buildOptimizationActionDescription(action),
                action.getActionType().name(),
                action.getOptimization()
                        .getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getId(),
                action.getOptimization()
                        .getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getProcess()
                        .getName(),
                action.getOptimization()
                        .getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getId(),
                action.getOptimization()
                        .getRiskAnalysis()
                        .getFailureCause()
                        .getFailureMode()
                        .getProcessStep()
                        .getName(),
                action.getStatus().name(),
                null
        );
    }



    private SearchResultResponse toGlobalSearchResult(
            GlobalSearchProjection result
    ) {
        return new SearchResultResponse(
                hexToUuid(result.getId()),
                SearchEntityType.valueOf(result.getEntityType()),
                result.getTitle(),
                result.getDescription(),
                result.getReference(),
                hexToUuid(result.getProcessId()),
                result.getProcessName(),
                hexToUuid(result.getProcessStepId()),
                result.getProcessStepName(),
                result.getStatus(),
                result.getActionPriority()
        );
    }

    private String buildFailureEffectTitle(
            FailureEffect failureEffect
    ) {
        return failureEffect.getFailureMode()
                .getDescription();
    }

    private String buildFailureEffectDescription(
            FailureEffect failureEffect
    ) {
        return String.format(
                "Our Plant: %s | Ship To Plant: %s | End User: %s | Severity: %d",
                valueOrEmpty(failureEffect.getOurPlant()),
                valueOrEmpty(failureEffect.getShipToPlant()),
                valueOrEmpty(failureEffect.getEndUser()),
                failureEffect.getSeverity()
        );
    }

    private String buildRiskAnalysisTitle(
            RiskAnalysis riskAnalysis
    ) {
        return "Risk Analysis";
    }

    private String buildRiskAnalysisDescription(
            RiskAnalysis riskAnalysis
    ) {
        return String.format(
                "Occurrence: %d | Detection: %d | Detection Scope: %s",
                riskAnalysis.getOccurrence(),
                riskAnalysis.getDetection(),
                riskAnalysis.getDetectionScope().name()
        );
    }

    private String buildOptimizationDescription(
            Optimization optimization
    ) {
        return String.format(
                "Severity: %d | Occurrence: %d | Detection: %d | Remarks: %s",
                optimization.getSeverity(),
                optimization.getOccurrence(),
                optimization.getDetection(),
                valueOrEmpty(optimization.getRemarks())
        );
    }

    private String buildOptimizationActionDescription(
            OptimizationAction action
    ) {
        return String.format(
                "Responsible: %s | Status: %s | Target Date: %s",
                valueOrEmpty(action.getResponsiblePerson()),
                action.getStatus().name(),
                action.getTargetCompletionDate()
        );
    }

    private UUID hexToUuid(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        String hex = value.toLowerCase();

        String uuid =
                hex.substring(0, 8) + "-"
                        + hex.substring(8, 12) + "-"
                        + hex.substring(12, 16) + "-"
                        + hex.substring(16, 20) + "-"
                        + hex.substring(20, 32);

        return UUID.fromString(uuid);
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return "";
        }

        return query.trim();
    }
    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}