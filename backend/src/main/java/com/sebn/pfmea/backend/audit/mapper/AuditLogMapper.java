package com.sebn.pfmea.backend.audit.mapper;

import com.sebn.pfmea.backend.audit.dto.response.AuditLogResponse;
import com.sebn.pfmea.backend.audit.entity.AuditLog;
import com.sebn.pfmea.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogResponse toResponse(AuditLog auditLog) {

        User performedBy = auditLog.getPerformedBy();

        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getAction(),
                auditLog.getOldData(),
                auditLog.getNewData(),
                performedBy.getId(),
                performedBy.getFirstName() + " " + performedBy.getLastName(),
                auditLog.getCreatedAt()
        );
    }
}
