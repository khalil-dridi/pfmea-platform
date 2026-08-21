package com.sebn.pfmea.backend.process.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.process.dto.request.ProcessCreateRequest;
import com.sebn.pfmea.backend.process.dto.request.ProcessUpdateRequest;
import com.sebn.pfmea.backend.process.dto.response.ProcessResponse;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.mapper.ProcessMapper;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
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
public class ProcessService {

    private static final String ENTITY_TYPE = "PROCESS";

    private final ProcessRepository processRepository;
    private final ProcessMapper processMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<ProcessResponse> getAllProcesses() {
        return processRepository.findAll()
                .stream()
                .map(processMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProcessResponse getProcessById(UUID id) {
        return processMapper.toResponse(findById(id));
    }

    public ProcessResponse createProcess(
            ProcessCreateRequest request,
            User currentUser
    ) {
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

        Process process = new Process();
        process.setName(request.name());
        process.setProcessNumber(request.processNumber());

        Process savedProcess = processRepository.save(process);

        return processMapper.toResponse(savedProcess);
    }

    public ProcessResponse updateProcess(
            UUID id,
            ProcessUpdateRequest request,
            User currentUser
    ) {
        Process existingProcess = findById(id);

        if (currentUser.getRole() == Role.ADMIN) {
            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    existingProcess,
                    request,
                    currentUser
            );

            return processMapper.toResponse(existingProcess);
        }

        existingProcess.setName(request.name());
        existingProcess.setProcessNumber(request.processNumber());

        Process savedProcess = processRepository.save(existingProcess);

        return processMapper.toResponse(savedProcess);
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
                    "Unable to create the process change request.",
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

    private Process findById(UUID id) {
        return processRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process not found with id: " + id
                        )
                );
    }
}