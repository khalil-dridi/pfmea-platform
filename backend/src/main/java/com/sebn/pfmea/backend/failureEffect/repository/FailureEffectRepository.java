package com.sebn.pfmea.backend.failureEffect.repository;

import com.sebn.pfmea.backend.failureEffect.entity.FailureEffect;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FailureEffectRepository
        extends JpaRepository<FailureEffect, UUID> {

    Optional<FailureEffect> findByFailureModeId(
            UUID failureModeId
    );

    List<FailureEffect> findByFailureModeIdIn(
            List<UUID> failureModeIds
    );
}