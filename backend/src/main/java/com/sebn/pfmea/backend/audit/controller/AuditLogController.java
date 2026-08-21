package com.sebn.pfmea.backend.audit.controller;

import com.sebn.pfmea.backend.audit.dto.response.AuditLogResponse;
import com.sebn.pfmea.backend.audit.service.AuditLogService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponse> getById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                auditLogService.getById(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getHistory(
            @RequestParam String entityType,
            @RequestParam UUID entityId
    ) {
        return ResponseEntity.ok(
                auditLogService.getHistory(
                        entityType,
                        entityId
                )
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLogResponse>> getUserHistory(
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(
                auditLogService.getUserHistory(userId)
        );
    }
}
