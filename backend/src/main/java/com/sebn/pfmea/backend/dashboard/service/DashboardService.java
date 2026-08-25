package com.sebn.pfmea.backend.dashboard.service;

import com.sebn.pfmea.backend.dashboard.dto.response.*;
import com.sebn.pfmea.backend.failureCause.repository.FailureCauseRepository;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
import com.sebn.pfmea.backend.function.repository.FunctionRepository;
import com.sebn.pfmea.backend.optimization.repository.OptimizationActionRepository;
import com.sebn.pfmea.backend.optimization.repository.OptimizationRepository;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
import com.sebn.pfmea.backend.processWorkElement.repository.ProcessWorkElementRepository;
import com.sebn.pfmea.backend.riskAnalysis.repository.RiskAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProcessRepository processRepository;
    private final ProcessStepRepository processStepRepository;
    private final ProcessWorkElementRepository processWorkElementRepository;
    private final FunctionRepository functionRepository;
    private final FailureModeRepository failureModeRepository;
    private final FailureCauseRepository failureCauseRepository;
    private final RiskAnalysisRepository riskAnalysisRepository;
    private final OptimizationRepository optimizationRepository;
    private final OptimizationActionRepository optimizationActionRepository;

    private PfmeaCoverageResponse getCoverage(
            UUID processId,
            UUID processStepId
    ) {
        long processes;
        long processSteps;
        long workElements;
        long functions;
        long failureModes;
        long failureCauses;

        if (processStepId != null) {

            processes = 1;

            processSteps = 1;

            workElements =
                    processWorkElementRepository
                            .countByProcessStepId(processStepId);

            functions =
                    functionRepository
                            .countByProcessStepScope(processStepId);

            failureModes =
                    failureModeRepository
                            .countByProcessStepId(processStepId);

            failureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepId(
                                    processStepId
                            );

        } else if (processId != null) {

            processes = 1;

            processSteps =
                    processStepRepository
                            .countByProcessId(processId);

            workElements =
                    processWorkElementRepository
                            .countByProcessStepProcessId(processId);

            functions =
                    functionRepository
                            .countByProcessScope(processId);

            failureModes =
                    failureModeRepository
                            .countByProcessStepProcessId(processId);

            failureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepProcessId(
                                    processId
                            );

        } else {

            processes = processRepository.count();
            processSteps = processStepRepository.count();
            workElements = processWorkElementRepository.count();
            functions = functionRepository.count();
            failureModes = failureModeRepository.count();
            failureCauses = failureCauseRepository.count();
        }

        return new PfmeaCoverageResponse(
                processes,
                processSteps,
                workElements,
                functions,
                failureModes,
                failureCauses
        );
    }

    private RiskDistributionResponse getRiskDistribution(
            UUID processId,
            UUID processStepId
    ) {
        Object[] result;
        long totalRiskAnalyses;
        long totalFailureCauses;

        if (processStepId != null) {

            result =
                    riskAnalysisRepository
                            .countRiskDistributionByProcessStep(
                                    processStepId
                            )
                            .get(0);

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

            totalFailureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepId(
                                    processStepId
                            );

        } else if (processId != null) {

            result =
                    riskAnalysisRepository
                            .countRiskDistributionByProcess(
                                    processId
                            )
                            .get(0);

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

            totalFailureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepProcessId(
                                    processId
                            );

        } else {

            result =
                    riskAnalysisRepository
                            .countRiskDistribution()
                            .get(0);

            totalRiskAnalyses =
                    riskAnalysisRepository.count();

            totalFailureCauses =
                    failureCauseRepository.count();
        }

        long high =
                ((Number) result[0]).longValue();

        long medium =
                ((Number) result[1]).longValue();

        long low =
                ((Number) result[2]).longValue();

        long notDefined =
                Math.max(
                        totalFailureCauses - totalRiskAnalyses,
                        0
                );

        return new RiskDistributionResponse(
                high,
                medium,
                low,
                notDefined
        );
    }

    private RiskAnalysisCoverageResponse getRiskAnalysisCoverage(
            UUID processId,
            UUID processStepId
    ) {
        long totalFailureCauses;
        long withRiskAnalysis;

        if (processStepId != null) {

            totalFailureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepId(
                                    processStepId
                            );

            withRiskAnalysis =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

        } else if (processId != null) {

            totalFailureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepProcessId(
                                    processId
                            );

            withRiskAnalysis =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

        } else {

            totalFailureCauses =
                    failureCauseRepository.count();

            withRiskAnalysis =
                    riskAnalysisRepository.count();
        }

        long withoutRiskAnalysis =
                Math.max(
                        totalFailureCauses - withRiskAnalysis,
                        0
                );

        double percentage =
                totalFailureCauses == 0
                        ? 0.0
                        : (withRiskAnalysis * 100.0)
                        / totalFailureCauses;

        return new RiskAnalysisCoverageResponse(
                totalFailureCauses,
                withRiskAnalysis,
                withoutRiskAnalysis,
                percentage
        );
    }

    private RiskImprovementResponse getRiskImprovement(
            UUID processId,
            UUID processStepId
    ) {
        RiskDistributionResponse current =
                getRiskDistribution(
                        processId,
                        processStepId
                );

        Object[] result;

        long optimizedTotal;
        long totalRiskAnalyses;

        if (processStepId != null) {

            result =
                    optimizationRepository
                            .countOptimizedRiskDistributionByProcessStep(
                                    processStepId
                            )
                            .get(0);

            optimizedTotal =
                    optimizationRepository
                            .countByRiskAnalysisFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

        } else if (processId != null) {

            result =
                    optimizationRepository
                            .countOptimizedRiskDistributionByProcess(
                                    processId
                            )
                            .get(0);

            optimizedTotal =
                    optimizationRepository
                            .countByRiskAnalysisFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

        } else {

            result =
                    optimizationRepository
                            .countOptimizedRiskDistribution()
                            .get(0);

            optimizedTotal =
                    optimizationRepository.count();

            totalRiskAnalyses =
                    riskAnalysisRepository.count();
        }

        long optimizedHigh =
                ((Number) result[0]).longValue();

        long optimizedMedium =
                ((Number) result[1]).longValue();

        long optimizedLow =
                ((Number) result[2]).longValue();

        long optimizedNotDefined =
                Math.max(
                        totalRiskAnalyses - optimizedTotal,
                        0
                );

        RiskDistributionResponse optimized =
                new RiskDistributionResponse(
                        optimizedHigh,
                        optimizedMedium,
                        optimizedLow,
                        optimizedNotDefined
                );

        return new RiskImprovementResponse(
                current,
                optimized
        );
    }

    private OptimizationActionsResponse getOptimizationActions(
            UUID processId,
            UUID processStepId
    ) {
        Object[] result;

        if (processStepId != null) {

            result =
                    optimizationActionRepository
                            .countOptimizationActionsByProcessStep(
                                    processStepId
                            )
                            .get(0);

        } else if (processId != null) {

            result =
                    optimizationActionRepository
                            .countOptimizationActionsByProcess(
                                    processId
                            )
                            .get(0);

        } else {

            result =
                    optimizationActionRepository
                            .countOptimizationActions()
                            .get(0);
        }

        long total =
                ((Number) result[0]).longValue();

        long inApplication =
                ((Number) result[1]).longValue();

        long closed =
                ((Number) result[2]).longValue();

        return new OptimizationActionsResponse(
                total,
                inApplication,
                closed
        );
    }

    private AreasNeedingAttentionResponse getAreasNeedingAttention(
            UUID processId,
            UUID processStepId
    ) {
        long totalFailureCauses;
        long totalRiskAnalyses;
        long totalOptimizations;

        if (processStepId != null) {

            totalFailureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepId(
                                    processStepId
                            );

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

            totalOptimizations =
                    optimizationRepository
                            .countByRiskAnalysisFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

        } else if (processId != null) {

            totalFailureCauses =
                    failureCauseRepository
                            .countByFailureModeProcessStepProcessId(
                                    processId
                            );

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

            totalOptimizations =
                    optimizationRepository
                            .countByRiskAnalysisFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

        } else {

            totalFailureCauses =
                    failureCauseRepository.count();

            totalRiskAnalyses =
                    riskAnalysisRepository.count();

            totalOptimizations =
                    optimizationRepository.count();
        }

        long failureCausesWithoutRiskAnalysis =
                Math.max(
                        totalFailureCauses - totalRiskAnalyses,
                        0
                );

        long riskAnalysesWithoutOptimization =
                Math.max(
                        totalRiskAnalyses - totalOptimizations,
                        0
                );

        RiskDistributionResponse riskDistribution =
                getRiskDistribution(
                        processId,
                        processStepId
                );

        long highPriorityRisks =
                riskDistribution.high();

        Object[] actionResult;

        if (processStepId != null) {

            actionResult =
                    optimizationActionRepository
                            .countOptimizationActionsByProcessStep(
                                    processStepId
                            )
                            .get(0);

        } else if (processId != null) {

            actionResult =
                    optimizationActionRepository
                            .countOptimizationActionsByProcess(
                                    processId
                            )
                            .get(0);

        } else {

            actionResult =
                    optimizationActionRepository
                            .countOptimizationActions()
                            .get(0);
        }

        long optimizationActionsInApplication =
                ((Number) actionResult[1]).longValue();

        return new AreasNeedingAttentionResponse(
                failureCausesWithoutRiskAnalysis,
                riskAnalysesWithoutOptimization,
                highPriorityRisks,
                optimizationActionsInApplication
        );
    }

    private OptimizationCoverageResponse getOptimizationCoverage(
            UUID processId,
            UUID processStepId
    ) {
        long totalRiskAnalyses;
        long withOptimization;

        if (processStepId != null) {

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

            withOptimization =
                    optimizationRepository
                            .countByRiskAnalysisFailureCauseFailureModeProcessStepId(
                                    processStepId
                            );

        } else if (processId != null) {

            totalRiskAnalyses =
                    riskAnalysisRepository
                            .countByFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

            withOptimization =
                    optimizationRepository
                            .countByRiskAnalysisFailureCauseFailureModeProcessStepProcessId(
                                    processId
                            );

        } else {

            totalRiskAnalyses =
                    riskAnalysisRepository.count();

            withOptimization =
                    optimizationRepository.count();
        }

        long withoutOptimization =
                Math.max(
                        totalRiskAnalyses - withOptimization,
                        0
                );

        double percentage =
                totalRiskAnalyses == 0
                        ? 0.0
                        : (withOptimization * 100.0)
                        / totalRiskAnalyses;

        return new OptimizationCoverageResponse(
                totalRiskAnalyses,
                withOptimization,
                withoutOptimization,
                percentage
        );
    }

    public DashboardOverviewResponse getOverview(
            UUID processId,
            UUID processStepId
    ) {
        return new DashboardOverviewResponse(
                getCoverage(
                        processId,
                        processStepId
                ),
                getRiskDistribution(
                        processId,
                        processStepId
                ),
                getRiskAnalysisCoverage(
                        processId,
                        processStepId
                ),
                getOptimizationCoverage(
                        processId,
                        processStepId
                ),
                getRiskImprovement(
                        processId,
                        processStepId
                ),
                getOptimizationActions(
                        processId,
                        processStepId
                ),
                getAreasNeedingAttention(
                        processId,
                        processStepId
                )
        );
    }
}