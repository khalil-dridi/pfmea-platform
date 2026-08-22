package com.sebn.pfmea.backend.failureEffect.controller;

import com.sebn.pfmea.backend.failureEffect.dto.request.FailureEffectCreateRequest;
import com.sebn.pfmea.backend.failureEffect.dto.request.FailureEffectUpdateRequest;
import com.sebn.pfmea.backend.failureEffect.dto.response.FailureEffectResponse;
import com.sebn.pfmea.backend.failureEffect.service.FailureEffectService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/failure-effects")
@RequiredArgsConstructor
public class FailureEffectController {

    private final FailureEffectService failureEffectService;
    private final UserRepository userRepository;

    @GetMapping("/failure-mode/{failureModeId}")
    public ResponseEntity<FailureEffectResponse>
    getFailureEffectByFailureMode(
            @PathVariable UUID failureModeId
    ) {
        return ResponseEntity.ok(
                failureEffectService.getFailureEffectByFailureMode(
                        failureModeId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<FailureEffectResponse> getFailureEffectById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                failureEffectService.getFailureEffectById(id)
        );
    }

    @PostMapping
    public ResponseEntity<FailureEffectResponse> createFailureEffect(
            @Valid @RequestBody FailureEffectCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FailureEffectResponse response =
                failureEffectService.createFailureEffect(
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
    public ResponseEntity<FailureEffectResponse> updateFailureEffect(
            @PathVariable UUID id,
            @Valid @RequestBody FailureEffectUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FailureEffectResponse response =
                failureEffectService.updateFailureEffect(
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
