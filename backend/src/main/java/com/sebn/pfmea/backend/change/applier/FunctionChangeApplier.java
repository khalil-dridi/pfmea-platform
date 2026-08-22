package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.function.dto.request.FunctionCreateRequest;
import com.sebn.pfmea.backend.function.dto.request.FunctionUpdateRequest;
import com.sebn.pfmea.backend.function.entity.Function;
import com.sebn.pfmea.backend.function.repository.FunctionRepository;
import com.sebn.pfmea.backend.function.enums.FunctionType;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
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
public class FunctionChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "FUNCTION";

    private final FunctionRepository functionRepository;
    private final ProcessRepository processRepository;
    private final ProcessStepRepository processStepRepository;
    private final ProcessWorkElementRepository processWorkElementRepository;
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

                FunctionCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FunctionCreateRequest.class
                        );

                Function function = new Function();

                function.setType(data.type());
                function.setDescription(data.description());

                setParent(function, data);

                Function savedFunction =
                        functionRepository.save(function);

                return savedFunction.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID functionId =
                        changeRequest.getEntityId();

                Function function =
                        functionRepository.findById(functionId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Function not found: "
                                                        + functionId
                                        )
                                );

                FunctionUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                FunctionUpdateRequest.class
                        );

                function.setType(data.type());
                function.setDescription(data.description());

                Function savedFunction =
                        functionRepository.save(function);

                return savedFunction.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize function change request.",
                    exception
            );
        }
    }

    private void setParent(
            Function function,
            FunctionCreateRequest data
    ) {
        switch (data.type()) {

            case PROCESS_ITEM -> {
                Process process =
                        processRepository.findById(
                                data.processId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Process not found: "
                                                + data.processId()
                                )
                        );

                function.setProcess(process);
            }

            case PROCESS_STEP -> {
                ProcessStep processStep =
                        processStepRepository.findById(
                                data.processStepId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Process step not found: "
                                                + data.processStepId()
                                )
                        );

                function.setProcessStep(processStep);
            }

            case WORK_ELEMENT -> {
                ProcessWorkElement workElement =
                        processWorkElementRepository.findById(
                                data.workElementId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Process work element not found: "
                                                + data.workElementId()
                                )
                        );

                function.setWorkElement(workElement);
            }
        }
    }
}