package com.sebn.pfmea.backend.processWorkElement.service;


import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processStep.repository.ProcessStepRepository;
import com.sebn.pfmea.backend.processWorkElement.dto.request.ProcessWorkElementCreateRequest;
import com.sebn.pfmea.backend.processWorkElement.dto.request.ProcessWorkElementUpdateRequest;
import com.sebn.pfmea.backend.processWorkElement.dto.response.ProcessWorkElementResponse;
import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import com.sebn.pfmea.backend.processWorkElement.mapper.ProcessWorkElementMapper;
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
import com.sebn.pfmea.backend.processWorkElement.dto.snapshot.ProcessWorkElementSnapshot;

@Service
@RequiredArgsConstructor
@Transactional
public class ProcessWorkElementService {

    private static final String ENTITY_TYPE = "PROCESS_WORK_ELEMENT";

    private final ProcessWorkElementRepository processWorkElementRepository;
    private final ProcessStepRepository processStepRepository;
    private final ProcessWorkElementMapper processWorkElementMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<ProcessWorkElementResponse> getWorkElementsByProcessStep(
            UUID processStepId
    ) {
        validateProcessStepExists(processStepId);

        return processWorkElementRepository
                .findByProcessStepIdOrderByElementNumberAsc(processStepId)
                .stream()
                .map(processWorkElementMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProcessWorkElementResponse getWorkElementById(UUID id) {
        return processWorkElementMapper.toResponse(findById(id));
    }

    public ProcessWorkElementResponse createWorkElement(
            ProcessWorkElementCreateRequest request,
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

        ProcessWorkElement workElement =
                new ProcessWorkElement();

        workElement.setProcessStep(processStep);
        workElement.setElementNumber(request.elementNumber());
        workElement.setName(request.name());
        workElement.setDescription(request.description());

        ProcessWorkElement savedWorkElement =
                processWorkElementRepository.save(workElement);

        return processWorkElementMapper.toResponse(
                savedWorkElement
        );
    }

    public ProcessWorkElementResponse updateWorkElement(
            UUID id,
            ProcessWorkElementUpdateRequest request,
            User currentUser
    ) {
        ProcessWorkElement existingWorkElement =
                findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            ProcessWorkElementSnapshot oldData =
                    new ProcessWorkElementSnapshot(
                            existingWorkElement.getId(),
                            existingWorkElement.getProcessStep().getId(),
                            existingWorkElement.getElementNumber(),
                            existingWorkElement.getName(),
                            existingWorkElement.getDescription()
                    );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return processWorkElementMapper.toResponse(
                    existingWorkElement
            );
        }

        existingWorkElement.setElementNumber(
                request.elementNumber()
        );

        existingWorkElement.setName(
                request.name()
        );

        existingWorkElement.setDescription(
                request.description()
        );

        ProcessWorkElement savedWorkElement =
                processWorkElementRepository.save(
                        existingWorkElement
                );

        return processWorkElementMapper.toResponse(
                savedWorkElement
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
                    "Unable to create the process work element change request.",
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

    private ProcessWorkElement findById(UUID id) {
        return processWorkElementRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Process work element not found with id: "
                                        + id
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