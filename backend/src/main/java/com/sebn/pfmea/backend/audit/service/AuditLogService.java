package com.sebn.pfmea.backend.audit.service;

import com.sebn.pfmea.backend.audit.dto.response.AuditLogResponse;
import com.sebn.pfmea.backend.audit.entity.AuditLog;
import com.sebn.pfmea.backend.audit.enums.AuditAction;
import com.sebn.pfmea.backend.audit.mapper.AuditLogMapper;
import com.sebn.pfmea.backend.audit.repository.AuditLogRepository;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

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
}