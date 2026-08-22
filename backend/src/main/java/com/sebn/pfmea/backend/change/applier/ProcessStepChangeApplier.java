package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
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
public class ProcessStepChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "PROCESS_STEP";

    private final ProcessStepRepository processStepRepository;
    private final ProcessRepository processRepository;
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

                ProcessStepCreateData data = jsonMapper.readValue(
                        changeRequest.getNewData(),
                        ProcessStepCreateData.class
                );

                Process process = processRepository.findById(
                        data.processId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Process not found: " + data.processId()
                        )
                );

                ProcessStep processStep = new ProcessStep();

                processStep.setProcess(process);
                processStep.setStepNumber(data.stepNumber());
                processStep.setName(data.name());
                processStep.setDescription(data.description());

                ProcessStep savedProcessStep =
                        processStepRepository.save(processStep);

                return savedProcessStep.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID processStepId =
                        changeRequest.getEntityId();

                ProcessStep processStep =
                        processStepRepository.findById(processStepId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Process step not found: "
                                                        + processStepId
                                        )
                                );

                ProcessStepUpdateData data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                ProcessStepUpdateData.class
                        );

                processStep.setStepNumber(data.stepNumber());
                processStep.setName(data.name());
                processStep.setDescription(data.description());

                ProcessStep savedProcessStep =
                        processStepRepository.save(processStep);

                return savedProcessStep.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize process step change request.",
                    exception
            );
        }
    }

    private record ProcessStepCreateData(
            UUID processId,
            Integer stepNumber,
            String name,
            String description
    ) {
    }

    private record ProcessStepUpdateData(
            Integer stepNumber,
            String name,
            String description
    ) {
    }
}