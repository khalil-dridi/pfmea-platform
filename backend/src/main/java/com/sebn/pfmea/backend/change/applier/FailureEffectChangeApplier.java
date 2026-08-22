package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.failureEffect.dto.request.FailureEffectCreateRequest;
import com.sebn.pfmea.backend.failureEffect.dto.request.FailureEffectUpdateRequest;
import com.sebn.pfmea.backend.failureEffect.entity.FailureEffect;
import com.sebn.pfmea.backend.failureEffect.repository.FailureEffectRepository;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class FailureEffectChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "FAILURE_EFFECT";

    private final FailureEffectRepository failureEffectRepository;
    private final FailureModeRepository failureModeRepository;
    private final JsonMapper jsonMapper;

    @Override
    public boolean supports(String entityType) {
        return ENTITY_TYPE.equalsIgnoreCase(entityType);
    }

    @Override
    @Transactional
    public UUID apply(ChangeRequest changeRequest) {

        try {
            if (changeRequest.getOperation()
                    == ChangeRequestOperation.CREATE) {

                FailureEffectCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FailureEffectCreateRequest.class
                        );

                FailureMode failureMode =
                        failureModeRepository.findById(
                                data.failureModeId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Failure mode not found: "
                                                + data.failureModeId()
                                )
                        );

                if (failureEffectRepository
                        .findByFailureModeId(
                                data.failureModeId()
                        )
                        .isPresent()) {

                    throw new IllegalStateException(
                            "A failure effect already exists for this failure mode."
                    );
                }

                FailureEffect failureEffect =
                        new FailureEffect();

                failureEffect.setFailureMode(failureMode);
                failureEffect.setOurPlant(data.ourPlant());
                failureEffect.setShipToPlant(data.shipToPlant());
                failureEffect.setEndUser(data.endUser());
                failureEffect.setSeverity(data.severity());

                FailureEffect savedFailureEffect =
                        failureEffectRepository.save(
                                failureEffect
                        );

                return savedFailureEffect.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID failureEffectId =
                        changeRequest.getEntityId();

                FailureEffect failureEffect =
                        failureEffectRepository.findById(
                                failureEffectId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Failure effect not found: "
                                                + failureEffectId
                                )
                        );

                FailureEffectUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FailureEffectUpdateRequest.class
                        );

                failureEffect.setOurPlant(
                        data.ourPlant()
                );

                failureEffect.setShipToPlant(
                        data.shipToPlant()
                );

                failureEffect.setEndUser(
                        data.endUser()
                );

                failureEffect.setSeverity(
                        data.severity()
                );

                FailureEffect savedFailureEffect =
                        failureEffectRepository.save(
                                failureEffect
                        );

                return savedFailureEffect.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize failure effect change request.",
                    exception
            );
        }
    }
}