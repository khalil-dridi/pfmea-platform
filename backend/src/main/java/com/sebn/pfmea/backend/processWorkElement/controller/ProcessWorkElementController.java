package com.sebn.pfmea.backend.processWorkElement.controller;

import com.sebn.pfmea.backend.processWorkElement.dto.request.ProcessWorkElementCreateRequest;
import com.sebn.pfmea.backend.processWorkElement.dto.request.ProcessWorkElementUpdateRequest;
import com.sebn.pfmea.backend.processWorkElement.dto.response.ProcessWorkElementResponse;
import com.sebn.pfmea.backend.processWorkElement.service.ProcessWorkElementService;
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
@RequestMapping("/api/process-work-elements")
@RequiredArgsConstructor
public class ProcessWorkElementController {

    private final ProcessWorkElementService processWorkElementService;
    private final UserRepository userRepository;

    @GetMapping("/process-step/{processStepId}")
    public ResponseEntity<List<ProcessWorkElementResponse>>
    getWorkElementsByProcessStep(
            @PathVariable UUID processStepId
    ) {
        return ResponseEntity.ok(
                processWorkElementService
                        .getWorkElementsByProcessStep(processStepId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcessWorkElementResponse> getWorkElementById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                processWorkElementService
                        .getWorkElementById(id)
        );
    }

    @PostMapping
    public ResponseEntity<ProcessWorkElementResponse> createWorkElement(
            @Valid @RequestBody ProcessWorkElementCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        ProcessWorkElementResponse response =
                processWorkElementService.createWorkElement(
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
    public ResponseEntity<ProcessWorkElementResponse> updateWorkElement(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessWorkElementUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        ProcessWorkElementResponse response =
                processWorkElementService.updateWorkElement(
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