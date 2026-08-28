package com.sebn.pfmea.backend.audit.repository;

import com.sebn.pfmea.backend.audit.entity.AuditLog;
import com.sebn.pfmea.backend.audit.enums.AuditAction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

    // Existing methods - keep them
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType,
            UUID entityId
    );

    List<AuditLog> findByPerformedByIdOrderByCreatedAtDesc(
            UUID performedById
    );

    // Paginated history
    Page<AuditLog> findAllByOrderByCreatedAtDesc(
            Pageable pageable
    );

    Page<AuditLog> findByEntityTypeIgnoreCaseOrderByCreatedAtDesc(
            String entityType,
            Pageable pageable
    );

    Page<AuditLog> findByActionOrderByCreatedAtDesc(
            AuditAction action,
            Pageable pageable
    );

    Page<AuditLog> findByPerformedByIdOrderByCreatedAtDesc(
            UUID performedById,
            Pageable pageable
    );

    Page<AuditLog> findByEntityTypeIgnoreCaseAndActionOrderByCreatedAtDesc(
            String entityType,
            AuditAction action,
            Pageable pageable
    );
    long countByAction(AuditAction action);
}