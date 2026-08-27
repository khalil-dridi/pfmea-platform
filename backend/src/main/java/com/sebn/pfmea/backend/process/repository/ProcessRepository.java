package com.sebn.pfmea.backend.process.repository;

import com.sebn.pfmea.backend.process.entity.Process;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessRepository
        extends JpaRepository<Process, UUID> {

    Page<Process> findByNameContainingIgnoreCaseOrProcessNumberContainingIgnoreCase(
            String name,
            String processNumber,
            Pageable pageable
    );
}