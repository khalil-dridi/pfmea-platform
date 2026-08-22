package com.sebn.pfmea.backend.failureMode.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.failureMode.dto.request.FailureModeCreateRequest;
import com.sebn.pfmea.backend.failureMode.dto.request.FailureModeUpdateRequest;
import com.sebn.pfmea.backend.failureMode.dto.response.FailureModeResponse;
import com.sebn.pfmea.backend.failureMode.dto.snapshot.FailureModeSnapshot;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import com.sebn.pfmea.backend.failureMode.mapper.FailureModeMapper;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
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
public class FailureModeService {

    private static final String ENTITY_TYPE = "FAILURE_MODE";

    private final FailureModeRepository failureModeRepository;
    private final ProcessStepRepository processStepRepository;
    private final FailureModeMapper failureModeMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<FailureModeResponse> getFailureModesByProcessStep(
            UUID processStepId
    ) {
        validateProcessStepExists(processStepId);

        return failureModeRepository
                .findByProcessStepIdOrderByFailureCodeAsc(processStepId)
                .stream()
                .map(failureModeMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FailureModeResponse getFailureModeById(UUID id) {
        return failureModeMapper.toResponse(findById(id));
    }

    public FailureModeResponse createFailureMode(
            FailureModeCreateRequest request,
            User currentUser
    ) {
        ProcessStep processStep =
                findProcessStepById(request.processStepId());

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

        FailureMode failureMode = new FailureMode();

        failureMode.setProcessStep(processStep);
        failureMode.setDescription(request.description());
        failureMode.setFailureCode(request.failureCode());

        FailureMode savedFailureMode =
                failureModeRepository.save(failureMode);

        return failureModeMapper.toResponse(savedFailureMode);
    }

    public FailureModeResponse updateFailureMode(
            UUID id,
            FailureModeUpdateRequest request,
            User currentUser
    ) {
        FailureMode existingFailureMode = findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            FailureModeSnapshot oldData = new FailureModeSnapshot(
                    existingFailureMode.getId(),
                    existingFailureMode.getProcessStep().getId(),
                    existingFailureMode.getDescription(),
                    existingFailureMode.getFailureCode()
            );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return failureModeMapper.toResponse(existingFailureMode);
        }

        existingFailureMode.setDescription(
                request.description()
        );

        existingFailureMode.setFailureCode(
                request.failureCode()
        );

        FailureMode savedFailureMode =
                failureModeRepository.save(existingFailureMode);

        return failureModeMapper.toResponse(savedFailureMode);
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
                    "Unable to create the failure mode change request.",
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

    private FailureMode findById(UUID id) {
        return failureModeRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Failure mode not found with id: " + id
                        )
                );
    }

    private ProcessStep findProcessStepById(UUID id) {
        return processStepRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process step not found with id: " + id
                        )
                );
    }

    private void validateProcessStepExists(UUID processStepId) {
        if (!processStepRepository.existsById(processStepId)) {
            throw new EntityNotFoundException(
                    "Process step not found with id: " + processStepId
            );
        }
    }
}
