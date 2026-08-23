package com.sebn.pfmea.backend.optimization.repository;

import com.sebn.pfmea.backend.optimization.entity.OptimizationAction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OptimizationActionRepository
        extends JpaRepository<OptimizationAction, UUID> {

    List<OptimizationAction> findByOptimizationIdOrderByTargetCompletionDateAsc(
            UUID optimizationId
    );
}
