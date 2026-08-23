package com.sebn.pfmea.backend.riskAnalysis.repository;

import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskAnalysisRepository
        extends JpaRepository<RiskAnalysis, UUID> {

    Optional<RiskAnalysis> findByFailureCauseId(UUID failureCauseId);
}