package com.sebn.pfmea.backend.riskAnalysis.repository;

import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RiskAnalysisRepository
        extends JpaRepository<RiskAnalysis, UUID> {

    Optional<RiskAnalysis> findByFailureCauseId(UUID failureCauseId);

    @Query("""
        SELECT
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.HIGH THEN 1 END),
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.MEDIUM THEN 1 END),
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.LOW THEN 1 END)
        FROM RiskAnalysis r
    """)
    List<Object[]> countRiskDistribution();

    long countByFailureCauseFailureModeProcessStepId(
            UUID processStepId
    );

    long countByFailureCauseFailureModeProcessStepProcessId(
            UUID processId
    );

    @Query("""
        SELECT
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.HIGH THEN 1 END),
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.MEDIUM THEN 1 END),
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.LOW THEN 1 END)
        FROM RiskAnalysis r
        WHERE r.failureCause.failureMode.processStep.id = :processStepId
    """)
    List<Object[]> countRiskDistributionByProcessStep(
            @Param("processStepId") UUID processStepId
    );

    @Query("""
        SELECT
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.HIGH THEN 1 END),
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.MEDIUM THEN 1 END),
            COUNT(CASE WHEN r.actionPriority = com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority.LOW THEN 1 END)
        FROM RiskAnalysis r
        WHERE r.failureCause.failureMode.processStep.process.id = :processId
    """)
    List<Object[]> countRiskDistributionByProcess(
            @Param("processId") UUID processId
    );
}