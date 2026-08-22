package com.sebn.pfmea.backend.failureMode.repository;

import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FailureModeRepository
        extends JpaRepository<FailureMode, UUID> {

    List<FailureMode> findByProcessStepIdOrderByFailureCodeAsc(
            UUID processStepId
    );
}