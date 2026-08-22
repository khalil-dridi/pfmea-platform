package com.sebn.pfmea.backend.failureMode.mapper;

import com.sebn.pfmea.backend.failureMode.dto.response.FailureModeResponse;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import org.springframework.stereotype.Component;

@Component
public class FailureModeMapper {

    public FailureModeResponse toResponse(FailureMode failureMode) {
        return new FailureModeResponse(
                failureMode.getId(),
                failureMode.getProcessStep().getId(),
                failureMode.getDescription(),
                failureMode.getFailureCode()
        );
    }
}