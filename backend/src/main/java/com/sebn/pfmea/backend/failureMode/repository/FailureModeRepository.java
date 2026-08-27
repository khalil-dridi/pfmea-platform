package com.sebn.pfmea.backend.failureMode.repository;

import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FailureModeRepository
        extends JpaRepository<FailureMode, UUID> {

    List<FailureMode> findByProcessStepIdOrderByFailureCodeAsc(
            UUID processStepId
    );
    long countByProcessStepId(UUID processStepId);

    long countByProcessStepProcessId(UUID processId);

    @Query("""
    SELECT fm
    FROM FailureMode fm
    WHERE (
        LOWER(fm.description) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(fm.failureCode) LIKE LOWER(CONCAT('%', :query, '%'))
    )
    AND (
        :processId IS NULL
        OR fm.processStep.process.id = :processId
    )
    AND (
        :processStepId IS NULL
        OR fm.processStep.id = :processStepId
    )
    ORDER BY fm.failureCode ASC
""")
    Page<FailureMode> search(
            @Param("query") String query,
            @Param("processId") UUID processId,
            @Param("processStepId") UUID processStepId,
            Pageable pageable
    );
}