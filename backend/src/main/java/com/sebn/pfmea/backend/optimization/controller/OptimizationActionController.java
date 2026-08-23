package com.sebn.pfmea.backend.optimization.controller;


import com.sebn.pfmea.backend.optimization.dto.request.OptimizationActionCreateRequest;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationActionUpdateRequest;
import com.sebn.pfmea.backend.optimization.dto.response.OptimizationActionResponse;
import com.sebn.pfmea.backend.optimization.service.OptimizationActionService;
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
@RequestMapping("/api/optimization-actions")
@RequiredArgsConstructor
public class OptimizationActionController {

    private final OptimizationActionService optimizationActionService;
    private final UserRepository userRepository;

    @GetMapping("/optimization/{optimizationId}")
    public ResponseEntity<List<OptimizationActionResponse>>
    getActionsByOptimization(
            @PathVariable UUID optimizationId
    ) {
        return ResponseEntity.ok(
                optimizationActionService.getActionsByOptimization(
                        optimizationId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<OptimizationActionResponse> getActionById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                optimizationActionService.getActionById(id)
        );
    }

    @PostMapping
    public ResponseEntity<OptimizationActionResponse> createAction(
            @Valid @RequestBody OptimizationActionCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        OptimizationActionResponse response =
                optimizationActionService.createAction(
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
    public ResponseEntity<OptimizationActionResponse> updateAction(
            @PathVariable UUID id,
            @Valid @RequestBody OptimizationActionUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        OptimizationActionResponse response =
                optimizationActionService.updateAction(
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
