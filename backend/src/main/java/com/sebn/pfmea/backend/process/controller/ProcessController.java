package com.sebn.pfmea.backend.process.controller;

import com.sebn.pfmea.backend.process.dto.request.ProcessCreateRequest;
import com.sebn.pfmea.backend.process.dto.request.ProcessUpdateRequest;
import com.sebn.pfmea.backend.process.dto.response.ProcessResponse;
import com.sebn.pfmea.backend.process.service.ProcessService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/processes")
@RequiredArgsConstructor
public class ProcessController {

    private final ProcessService processService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ProcessResponse>> getAllProcesses() {
        return ResponseEntity.ok(
                processService.getAllProcesses()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcessResponse> getProcessById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                processService.getProcessById(id)
        );
    }

    @PostMapping
    public ResponseEntity<ProcessResponse> createProcess(
            @Valid @RequestBody ProcessCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        ProcessResponse response =
                processService.createProcess(
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
    public ResponseEntity<ProcessResponse> updateProcess(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        ProcessResponse response =
                processService.updateProcess(
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
