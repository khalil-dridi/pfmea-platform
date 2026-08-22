package com.sebn.pfmea.backend.function.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.function.dto.request.FunctionCreateRequest;
import com.sebn.pfmea.backend.function.dto.request.FunctionUpdateRequest;
import com.sebn.pfmea.backend.function.dto.response.FunctionResponse;
import com.sebn.pfmea.backend.function.dto.snapshot.FunctionSnapshot;
import com.sebn.pfmea.backend.function.entity.Function;
import com.sebn.pfmea.backend.function.enums.FunctionType;
import com.sebn.pfmea.backend.function.mapper.FunctionMapper;
import com.sebn.pfmea.backend.function.repository.FunctionRepository;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import com.sebn.pfmea.backend.processWorkElement.repository.ProcessWorkElementRepository;
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
public class FunctionService {

    private static final String ENTITY_TYPE = "FUNCTION";

    private final FunctionRepository functionRepository;
    private final ProcessRepository processRepository;
    private final ProcessStepRepository processStepRepository;
    private final ProcessWorkElementRepository processWorkElementRepository;
    private final FunctionMapper functionMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<FunctionResponse> getFunctionsByProcess(UUID processId) {

        validateProcessExists(processId);

        return functionRepository.findByProcessId(processId)
                .stream()
                .map(functionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FunctionResponse> getFunctionsByProcessStep(
            UUID processStepId
    ) {
        validateProcessStepExists(processStepId);

        return functionRepository.findByProcessStepId(processStepId)
                .stream()
                .map(functionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FunctionResponse> getFunctionsByWorkElement(
            UUID workElementId
    ) {
        validateWorkElementExists(workElementId);

        return functionRepository.findByWorkElementId(workElementId)
                .stream()
                .map(functionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FunctionResponse getFunctionById(UUID id) {
        return functionMapper.toResponse(findById(id));
    }

    public FunctionResponse createFunction(
            FunctionCreateRequest request,
            User currentUser
    ) {
        validateParent(request);

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

        Function function = new Function();

        function.setType(request.type());
        function.setDescription(request.description());

        setParent(function, request);

        Function savedFunction =
                functionRepository.save(function);

        return functionMapper.toResponse(savedFunction);
    }

    public FunctionResponse updateFunction(
            UUID id,
            FunctionUpdateRequest request,
            User currentUser
    ) {
        Function existingFunction = findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            FunctionSnapshot oldData = new FunctionSnapshot(
                    existingFunction.getId(),
                    existingFunction.getType(),
                    existingFunction.getDescription(),
                    existingFunction.getProcess() != null
                            ? existingFunction.getProcess().getId()
                            : null,
                    existingFunction.getProcessStep() != null
                            ? existingFunction.getProcessStep().getId()
                            : null,
                    existingFunction.getWorkElement() != null
                            ? existingFunction.getWorkElement().getId()
                            : null
            );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return functionMapper.toResponse(existingFunction);
        }

        existingFunction.setType(request.type());
        existingFunction.setDescription(request.description());

        Function savedFunction =
                functionRepository.save(existingFunction);

        return functionMapper.toResponse(savedFunction);
    }

    private void validateParent(FunctionCreateRequest request) {

        switch (request.type()) {

            case PROCESS_ITEM -> {
                requireId(
                        request.processId(),
                        "processId is required for PROCESS_ITEM."
                );

                if (request.processStepId() != null
                        || request.workElementId() != null) {
                    throw new IllegalArgumentException(
                            "PROCESS_ITEM function can only reference a Process."
                    );
                }

                validateProcessExists(request.processId());
            }

            case PROCESS_STEP -> {
                requireId(
                        request.processStepId(),
                        "processStepId is required for PROCESS_STEP."
                );

                if (request.processId() != null
                        || request.workElementId() != null) {
                    throw new IllegalArgumentException(
                            "PROCESS_STEP function can only reference a ProcessStep."
                    );
                }

                validateProcessStepExists(request.processStepId());
            }

            case WORK_ELEMENT -> {
                requireId(
                        request.workElementId(),
                        "workElementId is required for WORK_ELEMENT."
                );

                if (request.processId() != null
                        || request.processStepId() != null) {
                    throw new IllegalArgumentException(
                            "WORK_ELEMENT function can only reference a WorkElement."
                    );
                }

                validateWorkElementExists(request.workElementId());
            }
        }
    }

    private void setParent(
            Function function,
            FunctionCreateRequest request
    ) {
        switch (request.type()) {

            case PROCESS_ITEM ->
                    function.setProcess(
                            processRepository.findById(
                                    request.processId()
                            ).orElseThrow()
                    );

            case PROCESS_STEP ->
                    function.setProcessStep(
                            processStepRepository.findById(
                                    request.processStepId()
                            ).orElseThrow()
                    );

            case WORK_ELEMENT ->
                    function.setWorkElement(
                            processWorkElementRepository.findById(
                                    request.workElementId()
                            ).orElseThrow()
                    );
        }
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
                    "Unable to create the function change request.",
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

    private Function findById(UUID id) {
        return functionRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Function not found with id: " + id
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

    private void validateProcessStepExists(UUID processStepId) {
        if (!processStepRepository.existsById(processStepId)) {
            throw new EntityNotFoundException(
                    "Process step not found with id: " + processStepId
            );
        }
    }

    private void validateWorkElementExists(UUID workElementId) {
        if (!processWorkElementRepository.existsById(workElementId)) {
            throw new EntityNotFoundException(
                    "Process work element not found with id: "
                            + workElementId
            );
        }
    }

    private void requireId(UUID id, String message) {
        if (id == null) {
            throw new IllegalArgumentException(message);
        }
    }
}