package com.sebn.pfmea.backend.failureEffect.mapper;

import com.sebn.pfmea.backend.failureEffect.dto.response.FailureEffectResponse;
import com.sebn.pfmea.backend.failureEffect.entity.FailureEffect;
import org.springframework.stereotype.Component;

@Component
public class FailureEffectMapper {

    public FailureEffectResponse toResponse(
            FailureEffect failureEffect
    ) {
        return new FailureEffectResponse(
                failureEffect.getId(),
                failureEffect.getFailureMode().getId(),
                failureEffect.getOurPlant(),
                failureEffect.getShipToPlant(),
                failureEffect.getEndUser(),
                failureEffect.getSeverity()
        );
    }
}
