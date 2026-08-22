package com.sebn.pfmea.backend.function.controller;

import com.sebn.pfmea.backend.function.dto.request.FunctionCreateRequest;
import com.sebn.pfmea.backend.function.dto.request.FunctionUpdateRequest;
import com.sebn.pfmea.backend.function.dto.response.FunctionResponse;
import com.sebn.pfmea.backend.function.service.FunctionService;
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
@RequestMapping("/api/functions")
@RequiredArgsConstructor
public class FunctionController {

    private final FunctionService functionService;
    private final UserRepository userRepository;

    @GetMapping("/process/{processId}")
    public ResponseEntity<List<FunctionResponse>> getFunctionsByProcess(
            @PathVariable UUID processId
    ) {
        return ResponseEntity.ok(
                functionService.getFunctionsByProcess(processId)
        );
    }

    @GetMapping("/process-step/{processStepId}")
    public ResponseEntity<List<FunctionResponse>> getFunctionsByProcessStep(
            @PathVariable UUID processStepId
    ) {
        return ResponseEntity.ok(
                functionService.getFunctionsByProcessStep(processStepId)
        );
    }

    @GetMapping("/work-element/{workElementId}")
    public ResponseEntity<List<FunctionResponse>> getFunctionsByWorkElement(
            @PathVariable UUID workElementId
    ) {
        return ResponseEntity.ok(
                functionService.getFunctionsByWorkElement(workElementId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<FunctionResponse> getFunctionById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                functionService.getFunctionById(id)
        );
    }

    @PostMapping
    public ResponseEntity<FunctionResponse> createFunction(
            @Valid @RequestBody FunctionCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FunctionResponse response =
                functionService.createFunction(
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
    public ResponseEntity<FunctionResponse> updateFunction(
            @PathVariable UUID id,
            @Valid @RequestBody FunctionUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        FunctionResponse response =
                functionService.updateFunction(
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
