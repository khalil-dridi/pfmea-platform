package com.sebn.pfmea.backend.optimization.repository;

import com.sebn.pfmea.backend.optimization.entity.Optimization;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OptimizationRepository
        extends JpaRepository<Optimization, UUID> {

    Optional<Optimization> findByRiskAnalysisId(UUID riskAnalysisId);
}
