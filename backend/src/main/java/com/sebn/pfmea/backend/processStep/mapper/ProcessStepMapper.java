package com.sebn.pfmea.backend.processStep.mapper;

import com.sebn.pfmea.backend.processStep.dto.response.ProcessStepResponse;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import org.springframework.stereotype.Component;

@Component
public class ProcessStepMapper {

    public ProcessStepResponse toResponse(ProcessStep processStep) {
        return new ProcessStepResponse(
                processStep.getId(),
                processStep.getProcess().getId(),
                processStep.getStepNumber(),
                processStep.getName(),
                processStep.getDescription(),
                processStep.getCreatedAt(),
                processStep.getUpdatedAt()
        );
    }
}