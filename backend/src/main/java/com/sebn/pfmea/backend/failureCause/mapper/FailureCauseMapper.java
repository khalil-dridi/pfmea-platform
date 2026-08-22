package com.sebn.pfmea.backend.failureCause.mapper;

import com.sebn.pfmea.backend.failureCause.dto.response.FailureCauseResponse;
import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import org.springframework.stereotype.Component;

@Component
public class FailureCauseMapper {

    public FailureCauseResponse toResponse(FailureCause failureCause) {
        return new FailureCauseResponse(
                failureCause.getId(),
                failureCause.getFailureMode().getId(),
                failureCause.getDescription()
        );
    }
}