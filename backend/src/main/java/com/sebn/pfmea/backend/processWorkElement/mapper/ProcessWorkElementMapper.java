package com.sebn.pfmea.backend.processWorkElement.mapper;

import com.sebn.pfmea.backend.processWorkElement.dto.response.ProcessWorkElementResponse;
import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import org.springframework.stereotype.Component;

@Component
public class ProcessWorkElementMapper {

    public ProcessWorkElementResponse toResponse(
            ProcessWorkElement workElement
    ) {
        return new ProcessWorkElementResponse(
                workElement.getId(),
                workElement.getProcessStep().getId(),
                workElement.getElementNumber(),
                workElement.getName(),
                workElement.getDescription(),
                workElement.getCreatedAt(),
                workElement.getUpdatedAt()
        );
    }
}