package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationActionCreateRequest;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationActionUpdateRequest;
import com.sebn.pfmea.backend.optimization.entity.Optimization;
import com.sebn.pfmea.backend.optimization.entity.OptimizationAction;
import com.sebn.pfmea.backend.optimization.repository.OptimizationActionRepository;
import com.sebn.pfmea.backend.optimization.repository.OptimizationRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class OptimizationActionChangeApplier
        implements ChangeApplier {

    private static final String ENTITY_TYPE =
            "OPTIMIZATION_ACTION";

    private final OptimizationActionRepository optimizationActionRepository;
    private final OptimizationRepository optimizationRepository;
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

                OptimizationActionCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                OptimizationActionCreateRequest.class
                        );

                Optimization optimization =
                        optimizationRepository.findById(
                                data.optimizationId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Optimization not found: "
                                                + data.optimizationId()
                                )
                        );

                OptimizationAction action =
                        new OptimizationAction();

                action.setOptimization(optimization);
                action.setActionType(data.actionType());
                action.setDescription(data.description());
                action.setResponsiblePerson(
                        data.responsiblePerson()
                );
                action.setTargetCompletionDate(
                        data.targetCompletionDate()
                );
                action.setStatus(data.status());
                action.setEvidence(data.evidence());
                action.setCompletionDate(
                        data.completionDate()
                );

                OptimizationAction savedAction =
                        optimizationActionRepository.save(
                                action
                        );

                return savedAction.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID actionId =
                        changeRequest.getEntityId();

                OptimizationAction action =
                        optimizationActionRepository.findById(
                                actionId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Optimization action not found: "
                                                + actionId
                                )
                        );

                OptimizationActionUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                OptimizationActionUpdateRequest.class
                        );

                action.setActionType(data.actionType());
                action.setDescription(data.description());
                action.setResponsiblePerson(
                        data.responsiblePerson()
                );
                action.setTargetCompletionDate(
                        data.targetCompletionDate()
                );
                action.setStatus(data.status());
                action.setEvidence(data.evidence());
                action.setCompletionDate(
                        data.completionDate()
                );

                OptimizationAction savedAction =
                        optimizationActionRepository.save(
                                action
                        );

                return savedAction.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize optimization action change request.",
                    exception
            );
        }
    }
}
