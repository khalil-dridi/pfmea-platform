package com.sebn.pfmea.backend.optimization.controller;

import com.sebn.pfmea.backend.optimization.dto.request.OptimizationCreateRequest;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationUpdateRequest;
import com.sebn.pfmea.backend.optimization.dto.response.OptimizationResponse;
import com.sebn.pfmea.backend.optimization.service.OptimizationService;
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
@RequestMapping("/api/optimizations")
@RequiredArgsConstructor
public class OptimizationController {

    private final OptimizationService optimizationService;
    private final UserRepository userRepository;

    @GetMapping("/risk-analysis/{riskAnalysisId}")
    public ResponseEntity<OptimizationResponse> getOptimizationByRiskAnalysis(
            @PathVariable UUID riskAnalysisId
    ) {
        OptimizationResponse response =
                optimizationService.getOptimizationByRiskAnalysis(
                        riskAnalysisId
                );

        if (response == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OptimizationResponse> getOptimizationById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                optimizationService.getOptimizationById(id)
        );
    }

    @PostMapping
    public ResponseEntity<OptimizationResponse> createOptimization(
            @Valid @RequestBody OptimizationCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        OptimizationResponse response =
                optimizationService.createOptimization(
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
    public ResponseEntity<OptimizationResponse> updateOptimization(
            @PathVariable UUID id,
            @Valid @RequestBody OptimizationUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        OptimizationResponse response =
                optimizationService.updateOptimization(
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
