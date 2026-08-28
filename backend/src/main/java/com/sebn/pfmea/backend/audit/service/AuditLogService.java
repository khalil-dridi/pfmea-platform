package com.sebn.pfmea.backend.audit.service;

import com.sebn.pfmea.backend.audit.dto.response.AuditLogResponse;
import com.sebn.pfmea.backend.audit.dto.response.AuditStatisticsResponse;
import com.sebn.pfmea.backend.audit.entity.AuditLog;
import com.sebn.pfmea.backend.audit.enums.AuditAction;
import com.sebn.pfmea.backend.audit.mapper.AuditLogMapper;
import com.sebn.pfmea.backend.audit.repository.AuditLogRepository;
import com.sebn.pfmea.backend.audit.specification.AuditLogSpecification;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import com.sebn.pfmea.backend.change.repository.ChangeRequestRepository;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;
    private final ChangeRequestRepository changeRequestRepository;

    public AuditLogResponse createAuditLog(
            String entityType,
            UUID entityId,
            AuditAction action,
            String oldData,
            String newData,
            User performedBy
    ) {
        AuditLog auditLog = new AuditLog();

        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setAction(action);
        auditLog.setOldData(oldData);
        auditLog.setNewData(newData);
        auditLog.setPerformedBy(performedBy);

        AuditLog savedAuditLog =
                auditLogRepository.save(auditLog);

        return auditLogMapper.toResponse(savedAuditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getHistory(
            String entityType,
            UUID entityId
    ) {
        return auditLogRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        entityType,
                        entityId
                )
                .stream()
                .map(auditLogMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getUserHistory(UUID userId) {
        return auditLogRepository
                .findByPerformedByIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(auditLogMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuditLogResponse getById(UUID id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Audit log not found."
                        )
                );

        return auditLogMapper.toResponse(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> searchHistory(
            String search,
            String entityType,
            AuditAction action,
            UUID userId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    ) {
        return auditLogRepository
                .findAll(
                        AuditLogSpecification.withFilters(
                                search,
                                entityType,
                                action,
                                userId,
                                from,
                                to
                        ),
                        pageable
                )
                .map(auditLogMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public AuditStatisticsResponse getStatistics(
            String search,
            String entityType,
            AuditAction action,
            UUID userId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        // Statistics use all filters EXCEPT action
        Specification<AuditLog> statisticsSpecification =
                AuditLogSpecification.withFilters(
                        search,
                        entityType,
                        null, // action is intentionally ignored
                        userId,
                        from,
                        to
                );

        long totalEvents = auditLogRepository.count(
                statisticsSpecification
        );

        long approved = auditLogRepository.count(
                statisticsSpecification.and(
                        (root, query, builder) ->
                                builder.equal(
                                        root.get("action"),
                                        AuditAction.APPROVE
                                )
                )
        );

        long rejected = auditLogRepository.count(
                statisticsSpecification.and(
                        (root, query, builder) ->
                                builder.equal(
                                        root.get("action"),
                                        AuditAction.REJECT
                                )
                )
        );

        long pending = changeRequestRepository.count(
                com.sebn.pfmea.backend.change.specification.ChangeRequestSpecification.withFilters(
                        search,
                        entityType,
                        userId,
                        from,
                        to
                )
        );

        return new AuditStatisticsResponse(
                totalEvents,
                approved,
                rejected,
                pending
        );
    }


}