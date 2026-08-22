package com.sebn.pfmea.backend.processStep.repository;

import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessStepRepository
        extends JpaRepository<ProcessStep, UUID> {

    List<ProcessStep> findByProcessIdOrderByStepNumberAsc(
            UUID processId
    );
}
