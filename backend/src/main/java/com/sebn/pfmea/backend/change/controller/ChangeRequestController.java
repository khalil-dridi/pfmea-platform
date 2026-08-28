package com.sebn.pfmea.backend.change.controller;

import com.sebn.pfmea.backend.change.dto.response.ChangeRequestResponse;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.repository.UserRepository;

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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/change-requests")
@RequiredArgsConstructor
public class ChangeRequestController {

    private final ChangeRequestService changeRequestService;
    private final UserRepository userRepository;

    /**
     * SUPER_ADMIN only:
     * Returns all pending change requests.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<ChangeRequestResponse>> getPendingRequests() {
        return ResponseEntity.ok(
                changeRequestService.getPendingRequests()
        );
    }

    /**
     * ADMIN only:
     * Returns only the authenticated ADMIN's own requests.
     */
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ChangeRequestResponse>> getMyRequests(
            Authentication authentication,

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            ChangeRequestOperation operation,

            @RequestParam(required = false)
            ChangeRequestStatus status,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        page = Math.max(page, 0);
        size = Math.min(Math.max(size, 1), 50);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        return ResponseEntity.ok(
                changeRequestService.getMyRequests(
                        currentUser,
                        search,
                        operation,
                        status,
                        from,
                        to,
                        pageable
                )
        );
    }

    /**
     * ADMIN:
     * Can only access his own request.
     *
     * SUPER_ADMIN:
     * Can access any request.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ChangeRequestResponse> getRequestById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                changeRequestService.getRequestById(
                        id,
                        currentUser
                )
        );
    }

    /**
     * SUPER_ADMIN only:
     * Approves a pending change request.
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ChangeRequestResponse> approveRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) String reviewComment,
            Authentication authentication
    ) {
        User reviewer = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                changeRequestService.approveRequest(
                        id,
                        reviewer,
                        reviewComment
                )
        );
    }

    /**
     * SUPER_ADMIN only:
     * Rejects a pending change request.
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ChangeRequestResponse> rejectRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) String reviewComment,
            Authentication authentication
    ) {
        User reviewer = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                changeRequestService.rejectRequest(
                        id,
                        reviewer,
                        reviewComment
                )
        );
    }

    private User getAuthenticatedUser(
            Authentication authentication
    ) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found."
                        )
                );
    }
}