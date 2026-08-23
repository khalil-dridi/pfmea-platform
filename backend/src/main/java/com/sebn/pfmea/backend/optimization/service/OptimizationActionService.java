package com.sebn.pfmea.backend.optimization.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationActionCreateRequest;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationActionUpdateRequest;
import com.sebn.pfmea.backend.optimization.dto.response.OptimizationActionResponse;
import com.sebn.pfmea.backend.optimization.dto.snapshot.OptimizationActionSnapshot;
import com.sebn.pfmea.backend.optimization.entity.Optimization;
import com.sebn.pfmea.backend.optimization.entity.OptimizationAction;
import com.sebn.pfmea.backend.optimization.mapper.OptimizationActionMapper;
import com.sebn.pfmea.backend.optimization.repository.OptimizationActionRepository;
import com.sebn.pfmea.backend.optimization.repository.OptimizationRepository;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.enums.Role;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
@Transactional
public class OptimizationActionService {

    private static final String ENTITY_TYPE = "OPTIMIZATION_ACTION";

    private final OptimizationActionRepository optimizationActionRepository;
    private final OptimizationRepository optimizationRepository;
    private final OptimizationActionMapper optimizationActionMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<OptimizationActionResponse> getActionsByOptimization(
            UUID optimizationId
    ) {
        validateOptimizationExists(optimizationId);

        return optimizationActionRepository
                .findByOptimizationIdOrderByTargetCompletionDateAsc(
                        optimizationId
                )
                .stream()
                .map(optimizationActionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OptimizationActionResponse getActionById(UUID id) {
        return optimizationActionMapper.toResponse(findById(id));
    }

    public OptimizationActionResponse createAction(
            OptimizationActionCreateRequest request,
            User currentUser
    ) {
        Optimization optimization =
                findOptimizationById(request.optimizationId());

        if (currentUser.getRole() == Role.ADMIN) {

            createChangeRequest(
                    ChangeRequestOperation.CREATE,
                    null,
                    null,
                    request,
                    currentUser
            );

            return null;
        }

        OptimizationAction action =
                new OptimizationAction();

        action.setOptimization(optimization);
        action.setActionType(request.actionType());
        action.setDescription(request.description());
        action.setResponsiblePerson(
                request.responsiblePerson()
        );
        action.setTargetCompletionDate(
                request.targetCompletionDate()
        );
        action.setStatus(request.status());
        action.setEvidence(request.evidence());
        action.setCompletionDate(
                request.completionDate()
        );

        OptimizationAction savedAction =
                optimizationActionRepository.save(action);

        return optimizationActionMapper.toResponse(
                savedAction
        );
    }

    public OptimizationActionResponse updateAction(
            UUID id,
            OptimizationActionUpdateRequest request,
            User currentUser
    ) {
        OptimizationAction existingAction =
                findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            OptimizationActionSnapshot oldData =
                    new OptimizationActionSnapshot(
                            existingAction.getId(),
                            existingAction.getOptimization().getId(),
                            existingAction.getActionType(),
                            existingAction.getDescription(),
                            existingAction.getResponsiblePerson(),
                            existingAction.getTargetCompletionDate(),
                            existingAction.getStatus(),
                            existingAction.getEvidence(),
                            existingAction.getCompletionDate()
                    );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return optimizationActionMapper.toResponse(
                    existingAction
            );
        }

        existingAction.setActionType(
                request.actionType()
        );
        existingAction.setDescription(
                request.description()
        );
        existingAction.setResponsiblePerson(
                request.responsiblePerson()
        );
        existingAction.setTargetCompletionDate(
                request.targetCompletionDate()
        );
        existingAction.setStatus(
                request.status()
        );
        existingAction.setEvidence(
                request.evidence()
        );
        existingAction.setCompletionDate(
                request.completionDate()
        );

        OptimizationAction savedAction =
                optimizationActionRepository.save(
                        existingAction
                );

        return optimizationActionMapper.toResponse(
                savedAction
        );
    }

    private void createChangeRequest(
            ChangeRequestOperation operation,
            UUID entityId,
            Object oldData,
            Object newData,
            User requester
    ) {
        try {
            ChangeRequestCreateRequest request =
                    new ChangeRequestCreateRequest(
                            ENTITY_TYPE,
                            entityId,
                            operation,
                            serialize(oldData),
                            serialize(newData)
                    );

            changeRequestService.createRequest(
                    request,
                    requester
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to create the optimization action change request.",
                    exception
            );
        }
    }

    private String serialize(Object data)
            throws JacksonException {

        if (data == null) {
            return "{}";
        }

        return jsonMapper.writeValueAsString(data);
    }

    private OptimizationAction findById(UUID id) {
        return optimizationActionRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Optimization action not found with id: "
                                        + id
                        )
                );
    }

    private Optimization findOptimizationById(UUID id) {
        return optimizationRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Optimization not found with id: " + id
                        )
                );
    }

    private void validateOptimizationExists(UUID optimizationId) {
        if (!optimizationRepository.existsById(optimizationId)) {
            throw new EntityNotFoundException(
                    "Optimization not found with id: " + optimizationId
            );
        }
    }
}
