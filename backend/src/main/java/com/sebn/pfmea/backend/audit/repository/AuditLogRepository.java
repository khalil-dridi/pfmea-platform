package com.sebn.pfmea.backend.audit.repository;

import com.sebn.pfmea.backend.audit.entity.AuditLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType,
            UUID entityId
    );

    List<AuditLog> findByPerformedByIdOrderByCreatedAtDesc(
            UUID performedById
    );
}