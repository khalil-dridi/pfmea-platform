package com.sebn.pfmea.backend.process.repository;

import com.sebn.pfmea.backend.process.entity.Process;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessRepository extends JpaRepository<Process, UUID> {
}