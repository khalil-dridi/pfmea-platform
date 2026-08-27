package com.sebn.pfmea.backend.optimization.repository;

import com.sebn.pfmea.backend.optimization.entity.OptimizationAction;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OptimizationActionRepository
        extends JpaRepository<OptimizationAction, UUID> {

    List<OptimizationAction> findByOptimizationIdOrderByTargetCompletionDateAsc(
            UUID optimizationId
    );

    @Query("""
    SELECT
        COUNT(a),
        COUNT(CASE WHEN a.status = com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus.IN_APPLICATION THEN 1 END),
        COUNT(CASE WHEN a.status = com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus.CLOSED THEN 1 END)
    FROM OptimizationAction a
""")
    List<Object[]> countOptimizationActions();

    long countByOptimizationRiskAnalysisFailureCauseFailureModeProcessStepId(
            UUID processStepId
    );

    long countByOptimizationRiskAnalysisFailureCauseFailureModeProcessStepProcessId(
            UUID processId
    );

    @Query("""
    SELECT
        COUNT(a),
        COUNT(CASE WHEN a.status = com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus.IN_APPLICATION THEN 1 END),
        COUNT(CASE WHEN a.status = com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus.CLOSED THEN 1 END)
    FROM OptimizationAction a
    WHERE a.optimization.riskAnalysis.failureCause.failureMode.processStep.id = :processStepId
""")
    List<Object[]> countOptimizationActionsByProcessStep(
            @Param("processStepId") UUID processStepId
    );

    @Query("""
    SELECT
        COUNT(a),
        COUNT(CASE WHEN a.status = com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus.IN_APPLICATION THEN 1 END),
        COUNT(CASE WHEN a.status = com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus.CLOSED THEN 1 END)
    FROM OptimizationAction a
    WHERE a.optimization.riskAnalysis.failureCause.failureMode.processStep.process.id = :processId
""")
    List<Object[]> countOptimizationActionsByProcess(
            @Param("processId") UUID processId
    );

    List<OptimizationAction> findByOptimizationIdInOrderByTargetCompletionDateAsc(
            List<UUID> optimizationIds
    );

    @Query("""
    SELECT a
    FROM OptimizationAction a
    WHERE (
        LOWER(a.description)
            LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(a.responsiblePerson)
            LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(a.evidence)
            LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(CAST(a.actionType AS string))
            LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(CAST(a.status AS string))
            LIKE LOWER(CONCAT('%', :query, '%'))
    )
    AND (
        :processId IS NULL
        OR a.optimization.riskAnalysis.failureCause.failureMode.processStep.process.id = :processId
    )
    AND (
        :processStepId IS NULL
        OR a.optimization.riskAnalysis.failureCause.failureMode.processStep.id = :processStepId
    )
    ORDER BY a.targetCompletionDate ASC
""")
    Page<OptimizationAction> search(
            @Param("query") String query,
            @Param("processId") UUID processId,
            @Param("processStepId") UUID processStepId,
            Pageable pageable
    );
}
