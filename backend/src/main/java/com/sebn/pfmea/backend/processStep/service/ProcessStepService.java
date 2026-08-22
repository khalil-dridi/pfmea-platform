package com.sebn.pfmea.backend.processStep.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
import com.sebn.pfmea.backend.processStep.dto.request.ProcessStepCreateRequest;
import com.sebn.pfmea.backend.processStep.dto.request.ProcessStepUpdateRequest;
import com.sebn.pfmea.backend.processStep.dto.response.ProcessStepResponse;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.mapper.ProcessStepMapper;
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
import com.sebn.pfmea.backend.processStep.dto.snapshot.ProcessStepSnapshot;

@Service
@RequiredArgsConstructor
@Transactional
public class ProcessStepService {

    private static final String ENTITY_TYPE = "PROCESS_STEP";

    private final ProcessStepRepository processStepRepository;
    private final ProcessRepository processRepository;
    private final ProcessStepMapper processStepMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<ProcessStepResponse> getStepsByProcess(UUID processId) {
        validateProcessExists(processId);

        return processStepRepository
                .findByProcessIdOrderByStepNumberAsc(processId)
                .stream()
                .map(processStepMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProcessStepResponse getProcessStepById(UUID id) {
        return processStepMapper.toResponse(findById(id));
    }

    public ProcessStepResponse createProcessStep(
            ProcessStepCreateRequest request,
            User currentUser
    ) {
        Process process = findProcessById(request.processId());

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

        ProcessStep processStep = new ProcessStep();
        processStep.setProcess(process);
        processStep.setStepNumber(request.stepNumber());
        processStep.setName(request.name());
        processStep.setDescription(request.description());

        ProcessStep savedProcessStep =
                processStepRepository.save(processStep);

        return processStepMapper.toResponse(savedProcessStep);
    }

    public ProcessStepResponse updateProcessStep(
            UUID id,
            ProcessStepUpdateRequest request,
            User currentUser
    ) {
        ProcessStep existingProcessStep = findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            ProcessStepSnapshot oldData = new ProcessStepSnapshot(
                    existingProcessStep.getId(),
                    existingProcessStep.getProcess().getId(),
                    existingProcessStep.getStepNumber(),
                    existingProcessStep.getName(),
                    existingProcessStep.getDescription()
            );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return processStepMapper.toResponse(existingProcessStep);
        }

        existingProcessStep.setStepNumber(request.stepNumber());
        existingProcessStep.setName(request.name());
        existingProcessStep.setDescription(request.description());

        ProcessStep savedProcessStep =
                processStepRepository.save(existingProcessStep);

        return processStepMapper.toResponse(savedProcessStep);
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
                    "Unable to create the process step change request.",
                    exception
            );
        }
    }

    private String serialize(Object data) throws JacksonException {
        if (data == null) {
            return "{}";
        }

        return jsonMapper.writeValueAsString(data);
    }

    private ProcessStep findById(UUID id) {
        return processStepRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process step not found with id: " + id
                        )
                );
    }

    private Process findProcessById(UUID id) {
        return processRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process not found with id: " + id
                        )
                );
    }

    private void validateProcessExists(UUID processId) {
        if (!processRepository.existsById(processId)) {
            throw new EntityNotFoundException(
                    "Process not found with id: " + processId
            );
        }
    }
}