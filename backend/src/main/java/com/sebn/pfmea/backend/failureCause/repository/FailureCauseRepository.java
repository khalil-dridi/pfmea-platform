package com.sebn.pfmea.backend.failureCause.repository;

import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FailureCauseRepository
        extends JpaRepository<FailureCause, UUID> {

    List<FailureCause> findByFailureModeIdOrderByIdAsc(
            UUID failureModeId
    );

    long countByFailureModeProcessStepId(UUID processStepId);

    long countByFailureModeProcessStepProcessId(UUID processId);
    List<FailureCause> findByFailureModeIdInOrderByFailureModeIdAscIdAsc(
            List<UUID> failureModeIds
    );
    @Query("""
    SELECT fc
    FROM FailureCause fc
    WHERE LOWER(fc.description)
          LIKE LOWER(CONCAT('%', :query, '%'))
      AND (
          :processId IS NULL
          OR fc.failureMode.processStep.process.id = :processId
      )
      AND (
          :processStepId IS NULL
          OR fc.failureMode.processStep.id = :processStepId
      )
    ORDER BY fc.id ASC
""")
    Page<FailureCause> search(
            @Param("query") String query,
            @Param("processId") UUID processId,
            @Param("processStepId") UUID processStepId,
            Pageable pageable
    );
}