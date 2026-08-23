package com.sebn.pfmea.backend.optimization.mapper;

import com.sebn.pfmea.backend.optimization.dto.response.OptimizationResponse;
import com.sebn.pfmea.backend.optimization.entity.Optimization;
import org.springframework.stereotype.Component;

@Component
public class OptimizationMapper {

    public OptimizationResponse toResponse(
            Optimization optimization
    ) {
        return new OptimizationResponse(
                optimization.getId(),
                optimization.getRiskAnalysis().getId(),
                optimization.getSeverity(),
                optimization.getOccurrence(),
                optimization.getDetection(),
                optimization.getActionPriority(),
                optimization.getSpecialProcess(),
                optimization.getSpecialCharacteristic(),
                optimization.getRemarks()
        );
    }
}
