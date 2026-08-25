package com.sebn.pfmea.backend.optimization.repository;

import com.sebn.pfmea.backend.optimization.entity.Optimization;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OptimizationRepository
        extends JpaRepository<Optimization, UUID> {

    Optional<Optimization> findByRiskAnalysisId(UUID riskAnalysisId);

    @Query("""
    SELECT
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.HIGH THEN 1 END),
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.MEDIUM THEN 1 END),
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.LOW THEN 1 END)
    FROM Optimization o
""")
    List<Object[]> countOptimizedRiskDistribution();
    long countByRiskAnalysisFailureCauseFailureModeProcessStepId(
            UUID processStepId
    );

    long countByRiskAnalysisFailureCauseFailureModeProcessStepProcessId(
            UUID processId
    );

    @Query("""
    SELECT
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.HIGH THEN 1 END),
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.MEDIUM THEN 1 END),
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.LOW THEN 1 END)
    FROM Optimization o
    WHERE o.riskAnalysis.failureCause.failureMode.processStep.id = :processStepId
""")
    List<Object[]> countOptimizedRiskDistributionByProcessStep(
            @Param("processStepId") UUID processStepId
    );

    @Query("""
    SELECT
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.HIGH THEN 1 END),
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.MEDIUM THEN 1 END),
        COUNT(CASE WHEN o.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.LOW THEN 1 END)
    FROM Optimization o
    WHERE o.riskAnalysis.failureCause.failureMode.processStep.process.id = :processId
""")
    List<Object[]> countOptimizedRiskDistributionByProcess(
            @Param("processId") UUID processId
    );
}
