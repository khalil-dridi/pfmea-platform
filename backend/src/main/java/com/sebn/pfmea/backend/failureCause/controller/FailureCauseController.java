package com.sebn.pfmea.backend.failureCause.controller;

import com.sebn.pfmea.backend.failureCause.dto.request.FailureCauseCreateRequest;
import com.sebn.pfmea.backend.failureCause.dto.request.FailureCauseUpdateRequest;
import com.sebn.pfmea.backend.failureCause.dto.response.FailureCauseResponse;
import com.sebn.pfmea.backend.failureCause.service.FailureCauseService;
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
@RequestMapping("/api/failure-causes")
@RequiredArgsConstructor
public class FailureCauseController {

    private final FailureCauseService failureCauseService;
    private final UserRepository userRepository;

    @GetMapping("/failure-mode/{failureModeId}")
    public ResponseEntity<List<FailureCauseResponse>>
    getFailureCausesByFailureMode(
            @PathVariable UUID failureModeId
    ) {
        return ResponseEntity.ok(
                failureCauseService.getFailureCausesByFailureMode(
                        failureModeId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<FailureCauseResponse> getFailureCauseById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                failureCauseService.getFailureCauseById(id)
        );
    }

    @PostMapping
    public ResponseEntity<FailureCauseResponse> createFailureCause(
            @Valid @RequestBody FailureCauseCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FailureCauseResponse response =
                failureCauseService.createFailureCause(
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
    public ResponseEntity<FailureCauseResponse> updateFailureCause(
            @PathVariable UUID id,
            @Valid @RequestBody FailureCauseUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FailureCauseResponse response =
                failureCauseService.updateFailureCause(
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
