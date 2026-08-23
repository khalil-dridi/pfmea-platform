package com.sebn.pfmea.backend.optimization.mapper;


import com.sebn.pfmea.backend.optimization.dto.response.OptimizationActionResponse;
import com.sebn.pfmea.backend.optimization.entity.OptimizationAction;
import org.springframework.stereotype.Component;

@Component
public class OptimizationActionMapper {

    public OptimizationActionResponse toResponse(
            OptimizationAction action
    ) {
        return new OptimizationActionResponse(
                action.getId(),
                action.getOptimization().getId(),
                action.getActionType(),
                action.getDescription(),
                action.getResponsiblePerson(),
                action.getTargetCompletionDate(),
                action.getStatus(),
                action.getEvidence(),
                action.getCompletionDate()
        );
    }
}