package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
import com.sebn.pfmea.backend.processWorkElement.dto.request.ProcessWorkElementCreateRequest;
import com.sebn.pfmea.backend.processWorkElement.dto.request.ProcessWorkElementUpdateRequest;
import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import com.sebn.pfmea.backend.processWorkElement.repository.ProcessWorkElementRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class ProcessWorkElementChangeApplier
        implements ChangeApplier {

    private static final String ENTITY_TYPE =
            "PROCESS_WORK_ELEMENT";

    private final ProcessWorkElementRepository
            processWorkElementRepository;

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

                ProcessWorkElementCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                ProcessWorkElementCreateRequest.class
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

                ProcessWorkElement workElement =
                        new ProcessWorkElement();

                workElement.setProcessStep(processStep);
                workElement.setElementNumber(
                        data.elementNumber()
                );
                workElement.setName(data.name());
                workElement.setDescription(
                        data.description()
                );

                ProcessWorkElement savedWorkElement =
                        processWorkElementRepository.save(
                                workElement
                        );

                return savedWorkElement.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID workElementId =
                        changeRequest.getEntityId();

                ProcessWorkElement workElement =
                        processWorkElementRepository.findById(
                                workElementId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Process work element not found: "
                                                + workElementId
                                )
                        );

                ProcessWorkElementUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                ProcessWorkElementUpdateRequest.class
                        );

                workElement.setElementNumber(
                        data.elementNumber()
                );
                workElement.setName(data.name());
                workElement.setDescription(
                        data.description()
                );

                ProcessWorkElement savedWorkElement =
                        processWorkElementRepository.save(
                                workElement
                        );

                return savedWorkElement.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize process work element "
                            + "change request.",
                    exception
            );
        }
    }
}