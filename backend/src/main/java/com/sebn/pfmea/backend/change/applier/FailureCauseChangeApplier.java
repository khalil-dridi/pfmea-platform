package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.failureCause.dto.request.FailureCauseCreateRequest;
import com.sebn.pfmea.backend.failureCause.dto.request.FailureCauseUpdateRequest;
import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import com.sebn.pfmea.backend.failureCause.repository.FailureCauseRepository;
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
public class FailureCauseChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "FAILURE_CAUSE";

    private final FailureCauseRepository failureCauseRepository;
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

                FailureCauseCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FailureCauseCreateRequest.class
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

                FailureCause failureCause =
                        new FailureCause();

                failureCause.setFailureMode(failureMode);
                failureCause.setDescription(
                        data.description()
                );

                FailureCause savedFailureCause =
                        failureCauseRepository.save(
                                failureCause
                        );

                return savedFailureCause.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID failureCauseId =
                        changeRequest.getEntityId();

                FailureCause failureCause =
                        failureCauseRepository.findById(
                                failureCauseId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Failure cause not found: "
                                                + failureCauseId
                                )
                        );

                FailureCauseUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FailureCauseUpdateRequest.class
                        );

                failureCause.setDescription(
                        data.description()
                );

                FailureCause savedFailureCause =
                        failureCauseRepository.save(
                                failureCause
                        );

                return savedFailureCause.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize failure cause change request.",
                    exception
            );
        }
    }
}
