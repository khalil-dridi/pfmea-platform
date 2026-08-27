package com.sebn.pfmea.backend.failureEffect.repository;

import com.sebn.pfmea.backend.failureEffect.entity.FailureEffect;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FailureEffectRepository
        extends JpaRepository<FailureEffect, UUID> {

    Optional<FailureEffect> findByFailureModeId(
            UUID failureModeId
    );

    List<FailureEffect> findByFailureModeIdIn(
            List<UUID> failureModeIds
    );

    @Query("""
    SELECT fe
    FROM FailureEffect fe
    WHERE (
        LOWER(fe.ourPlant) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(fe.shipToPlant) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(fe.endUser) LIKE LOWER(CONCAT('%', :query, '%'))
    )
    AND (
        :processId IS NULL
        OR fe.failureMode.processStep.process.id = :processId
    )
    AND (
        :processStepId IS NULL
        OR fe.failureMode.processStep.id = :processStepId
    )
""")
    Page<FailureEffect> search(
            @Param("query") String query,
            @Param("processId") UUID processId,
            @Param("processStepId") UUID processStepId,
            Pageable pageable
    );
}