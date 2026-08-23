package com.sebn.pfmea.backend.riskAnalysis.controller;

import com.sebn.pfmea.backend.riskAnalysis.dto.request.RiskAnalysisCreateRequest;
import com.sebn.pfmea.backend.riskAnalysis.dto.request.RiskAnalysisUpdateRequest;
import com.sebn.pfmea.backend.riskAnalysis.dto.response.RiskAnalysisResponse;
import com.sebn.pfmea.backend.riskAnalysis.service.RiskAnalysisService;
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
@RequestMapping("/api/risk-analyses")
@RequiredArgsConstructor
public class RiskAnalysisController {

    private final RiskAnalysisService riskAnalysisService;
    private final UserRepository userRepository;

    @GetMapping("/failure-cause/{failureCauseId}")
    public ResponseEntity<RiskAnalysisResponse>
    getRiskAnalysisByFailureCause(
            @PathVariable UUID failureCauseId
    ) {
        return ResponseEntity.ok(
                riskAnalysisService.getRiskAnalysisByFailureCause(
                        failureCauseId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskAnalysisResponse> getRiskAnalysisById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                riskAnalysisService.getRiskAnalysisById(id)
        );
    }

    @PostMapping
    public ResponseEntity<RiskAnalysisResponse> createRiskAnalysis(
            @Valid @RequestBody RiskAnalysisCreateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        RiskAnalysisResponse response =
                riskAnalysisService.createRiskAnalysis(
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
    public ResponseEntity<RiskAnalysisResponse> updateRiskAnalysis(
            @PathVariable UUID id,
            @Valid @RequestBody RiskAnalysisUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = getAuthenticatedUser(authentication);

        RiskAnalysisResponse response =
                riskAnalysisService.updateRiskAnalysis(
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