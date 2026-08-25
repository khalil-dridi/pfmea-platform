package com.sebn.pfmea.backend.dashboard.controller;

import com.sebn.pfmea.backend.dashboard.dto.response.DashboardOverviewResponse;
import com.sebn.pfmea.backend.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getOverview(
            @RequestParam(required = false) UUID processId,
            @RequestParam(required = false) UUID processStepId
    ) {
        return ResponseEntity.ok(
                dashboardService.getOverview(
                        processId,
                        processStepId
                )
        );
    }
}