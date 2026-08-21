package com.sebn.pfmea.backend.change.controller;

import com.sebn.pfmea.backend.change.dto.response.ChangeRequestResponse;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/change-requests")
@RequiredArgsConstructor
public class ChangeRequestController {

    private final ChangeRequestService changeRequestService;
    private final UserRepository userRepository;

    @GetMapping("/pending")
    public ResponseEntity<List<ChangeRequestResponse>> getPendingRequests() {
        return ResponseEntity.ok(
                changeRequestService.getPendingRequests()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeRequestResponse> getRequestById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                changeRequestService.getRequestById(id)
        );
    }

    @PostMapping("/{id}/approve")
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

    @PostMapping("/{id}/reject")
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