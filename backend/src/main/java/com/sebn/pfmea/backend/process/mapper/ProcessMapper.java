package com.sebn.pfmea.backend.process.mapper;

import com.sebn.pfmea.backend.process.dto.response.ProcessResponse;
import com.sebn.pfmea.backend.process.entity.Process;
import org.springframework.stereotype.Component;

@Component
public class ProcessMapper {

    public ProcessResponse toResponse(Process process) {
        return new ProcessResponse(
                process.getId(),
                process.getName(),
                process.getProcessNumber(),
                process.getCreatedAt(),
                process.getUpdatedAt()
        );
    }
}
