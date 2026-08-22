package com.sebn.pfmea.backend.processWorkElement.repository;

import java.util.List;
import java.util.UUID;

import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessWorkElementRepository
        extends JpaRepository<ProcessWorkElement, UUID> {

    List<ProcessWorkElement> findByProcessStepIdOrderByElementNumberAsc(
            UUID processStepId
    );
}