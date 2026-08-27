package com.sebn.pfmea.backend.processWorkElement.repository;

import java.util.List;
import java.util.UUID;

import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProcessWorkElementRepository
        extends JpaRepository<ProcessWorkElement, UUID> {

    List<ProcessWorkElement> findByProcessStepIdOrderByElementNumberAsc(
            UUID processStepId
    );
    long countByProcessStepId(UUID processStepId);

    long countByProcessStepProcessId(UUID processId);

    @Query("""
    SELECT pwe
    FROM ProcessWorkElement pwe
    WHERE pwe.processStep.id = :processStepId
      AND (
            LOWER(pwe.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(pwe.description) LIKE LOWER(CONCAT('%', :query, '%'))
            OR CAST(pwe.elementNumber AS string) LIKE CONCAT('%', :query, '%')
          )
    ORDER BY pwe.elementNumber ASC
    """)
    Page<ProcessWorkElement> search(
            @Param("processStepId") UUID processStepId,
            @Param("query") String query,
            Pageable pageable
    );
}