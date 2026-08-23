package com.sebn.pfmea.backend.riskAnalysis.mapper;

import com.sebn.pfmea.backend.riskAnalysis.dto.response.RiskAnalysisResponse;
import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import org.springframework.stereotype.Component;

@Component
public class RiskAnalysisMapper {

    public RiskAnalysisResponse toResponse(
            RiskAnalysis riskAnalysis
    ) {
        return new RiskAnalysisResponse(
                riskAnalysis.getId(),
                riskAnalysis.getFailureCause().getId(),
                riskAnalysis.getCurrentPreventionControl(),
                riskAnalysis.getOccurrence(),
                riskAnalysis.getCurrentDetectionControl(),
                riskAnalysis.getDetection(),
                riskAnalysis.getDetectionScope(),
                riskAnalysis.getActionPriority(),
                riskAnalysis.getSpecialProcess(),
                riskAnalysis.getSpecialCharacteristic()
        );
    }
}