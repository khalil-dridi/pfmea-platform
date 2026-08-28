package com.sebn.pfmea.backend.audit.controller;

import com.sebn.pfmea.backend.audit.dto.response.AuditLogResponse;
import com.sebn.pfmea.backend.audit.dto.response.AuditStatisticsResponse;
import com.sebn.pfmea.backend.audit.enums.AuditAction;
import com.sebn.pfmea.backend.audit.service.AuditLogService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final AuditLogService auditLogService;

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponse> getById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                auditLogService.getById(id)
        );
    }

    @GetMapping("/history")
    public ResponseEntity<Page<AuditLogResponse>> searchHistory(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        page = Math.max(page, DEFAULT_PAGE);

        size = Math.min(
                Math.max(size, 1),
                MAX_SIZE
        );

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        return ResponseEntity.ok(
                auditLogService.searchHistory(
                        search,
                        entityType,
                        action,
                        userId,
                        from,
                        to,
                        pageable
                )
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

    @GetMapping("/statistics")
    public ResponseEntity<AuditStatisticsResponse> getStatistics(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to
    ) {
        return ResponseEntity.ok(
                auditLogService.getStatistics(
                        search,
                        entityType,
                        action,
                        userId,
                        from,
                        to
                )
        );
    }

}