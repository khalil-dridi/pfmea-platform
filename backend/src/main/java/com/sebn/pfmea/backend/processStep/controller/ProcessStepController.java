package com.sebn.pfmea.backend.processStep.controller;


import com.sebn.pfmea.backend.processStep.dto.request.ProcessStepCreateRequest;
import com.sebn.pfmea.backend.processStep.dto.request.ProcessStepUpdateRequest;
import com.sebn.pfmea.backend.processStep.dto.response.ProcessStepResponse;
import com.sebn.pfmea.backend.processStep.service.ProcessStepService;
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
@RequestMapping("/api/process-steps")
@RequiredArgsConstructor
public class ProcessStepController {

    private final ProcessStepService processStepService;
    private final UserRepository userRepository;

    @GetMapping("/process/{processId}")
    public ResponseEntity<List<ProcessStepResponse>> getStepsByProcess(
            @PathVariable UUID processId
    ) {
        return ResponseEntity.ok(
                processStepService.getStepsByProcess(processId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcessStepResponse> getProcessStepById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                processStepService.getProcessStepById(id)
        );
    }

    @PostMapping
    public ResponseEntity<ProcessStepResponse> createProcessStep(
            @Valid @RequestBody ProcessStepCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        ProcessStepResponse response =
                processStepService.createProcessStep(
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
    public ResponseEntity<ProcessStepResponse> updateProcessStep(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessStepUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        ProcessStepResponse response =
                processStepService.updateProcessStep(
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