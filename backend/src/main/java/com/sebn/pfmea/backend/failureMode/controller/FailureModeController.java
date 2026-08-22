package com.sebn.pfmea.backend.failureMode.controller;

import com.sebn.pfmea.backend.failureMode.dto.request.FailureModeCreateRequest;
import com.sebn.pfmea.backend.failureMode.dto.request.FailureModeUpdateRequest;
import com.sebn.pfmea.backend.failureMode.dto.response.FailureModeResponse;
import com.sebn.pfmea.backend.failureMode.service.FailureModeService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/failure-modes")
@RequiredArgsConstructor
public class FailureModeController {

    private final FailureModeService failureModeService;
    private final UserRepository userRepository;

    @GetMapping("/process-step/{processStepId}")
    public ResponseEntity<List<FailureModeResponse>>
    getFailureModesByProcessStep(
            @PathVariable UUID processStepId
    ) {
        return ResponseEntity.ok(
                failureModeService.getFailureModesByProcessStep(
                        processStepId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<FailureModeResponse> getFailureModeById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                failureModeService.getFailureModeById(id)
        );
    }

    @PostMapping
    public ResponseEntity<FailureModeResponse> createFailureMode(
            @Valid @RequestBody FailureModeCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FailureModeResponse response =
                failureModeService.createFailureMode(
                        request,
                        currentUser
                );

        if (response == null) {
            return ResponseEntity
                    .status(HttpStatus.ACCEPTED)
                    .build();
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FailureModeResponse> updateFailureMode(
            @PathVariable UUID id,
            @Valid @RequestBody FailureModeUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FailureModeResponse response =
                failureModeService.updateFailureMode(
                        id,
                        request,
                        currentUser
                );

        if (response == null) {
            return ResponseEntity
                    .status(HttpStatus.ACCEPTED)
                    .build();
        }

        return ResponseEntity.ok(response);
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
