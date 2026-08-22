package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.failureMode.dto.request.FailureModeCreateRequest;
import com.sebn.pfmea.backend.failureMode.dto.request.FailureModeUpdateRequest;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class FailureModeChangeApplier
        implements ChangeApplier {

    private static final String ENTITY_TYPE = "FAILURE_MODE";

    private final FailureModeRepository failureModeRepository;
    private final ProcessStepRepository processStepRepository;
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

                FailureModeCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FailureModeCreateRequest.class
                        );

                ProcessStep processStep =
                        processStepRepository.findById(
                                data.processStepId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Process step not found: "
                                                + data.processStepId()
                                )
                        );

                FailureMode failureMode =
                        new FailureMode();

                failureMode.setProcessStep(processStep);
                failureMode.setDescription(
                        data.description()
                );
                failureMode.setFailureCode(
                        data.failureCode()
                );

                FailureMode savedFailureMode =
                        failureModeRepository.save(
                                failureMode
                        );

                return savedFailureMode.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID failureModeId =
                        changeRequest.getEntityId();

                FailureMode failureMode =
                        failureModeRepository.findById(
                                failureModeId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Failure mode not found: "
                                                + failureModeId
                                )
                        );

                FailureModeUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FailureModeUpdateRequest.class
                        );

                failureMode.setDescription(
                        data.description()
                );

                failureMode.setFailureCode(
                        data.failureCode()
                );

                FailureMode savedFailureMode =
                        failureModeRepository.save(
                                failureMode
                        );

                return savedFailureMode.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize failure mode change request.",
                    exception
            );
        }
    }
}