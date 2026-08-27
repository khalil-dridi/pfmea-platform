package com.sebn.pfmea.backend.processStep.repository;

import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProcessStepRepository
        extends JpaRepository<ProcessStep, UUID> {

    List<ProcessStep> findByProcessIdOrderByStepNumberAsc(
            UUID processId
    );

    long countByProcessId(UUID processId);

    @Query("""
        SELECT ps
        FROM ProcessStep ps
        WHERE ps.process.id = :processId
          AND (
                LOWER(ps.name)
                    LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(ps.description)
                    LIKE LOWER(CONCAT('%', :query, '%'))
                OR CAST(ps.stepNumber AS string)
                    LIKE CONCAT('%', :query, '%')
              )
        ORDER BY ps.stepNumber ASC
        """)
    Page<ProcessStep> search(
            @Param("processId") UUID processId,
            @Param("query") String query,
            Pageable pageable
    );
}