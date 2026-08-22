package com.sebn.pfmea.backend.failureCause.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.failureCause.dto.request.FailureCauseCreateRequest;
import com.sebn.pfmea.backend.failureCause.dto.request.FailureCauseUpdateRequest;
import com.sebn.pfmea.backend.failureCause.dto.response.FailureCauseResponse;
import com.sebn.pfmea.backend.failureCause.dto.snapshot.FailureCauseSnapshot;
import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import com.sebn.pfmea.backend.failureCause.mapper.FailureCauseMapper;
import com.sebn.pfmea.backend.failureCause.repository.FailureCauseRepository;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
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
public class FailureCauseService {

    private static final String ENTITY_TYPE = "FAILURE_CAUSE";

    private final FailureCauseRepository failureCauseRepository;
    private final FailureModeRepository failureModeRepository;
    private final FailureCauseMapper failureCauseMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public List<FailureCauseResponse> getFailureCausesByFailureMode(
            UUID failureModeId
    ) {
        validateFailureModeExists(failureModeId);

        return failureCauseRepository
                .findByFailureModeIdOrderByIdAsc(failureModeId)
                .stream()
                .map(failureCauseMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FailureCauseResponse getFailureCauseById(UUID id) {
        return failureCauseMapper.toResponse(findById(id));
    }

    public FailureCauseResponse createFailureCause(
            FailureCauseCreateRequest request,
            User currentUser
    ) {
        FailureMode failureMode =
                findFailureModeById(request.failureModeId());

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

        FailureCause failureCause =
                new FailureCause();

        failureCause.setFailureMode(failureMode);
        failureCause.setDescription(request.description());

        FailureCause savedFailureCause =
                failureCauseRepository.save(failureCause);

        return failureCauseMapper.toResponse(
                savedFailureCause
        );
    }

    public FailureCauseResponse updateFailureCause(
            UUID id,
            FailureCauseUpdateRequest request,
            User currentUser
    ) {
        FailureCause existingFailureCause =
                findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            FailureCauseSnapshot oldData =
                    new FailureCauseSnapshot(
                            existingFailureCause.getId(),
                            existingFailureCause.getFailureMode().getId(),
                            existingFailureCause.getDescription()
                    );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return failureCauseMapper.toResponse(
                    existingFailureCause
            );
        }

        existingFailureCause.setDescription(
                request.description()
        );

        FailureCause savedFailureCause =
                failureCauseRepository.save(
                        existingFailureCause
                );

        return failureCauseMapper.toResponse(
                savedFailureCause
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
                    "Unable to create the failure cause change request.",
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

    private FailureCause findById(UUID id) {
        return failureCauseRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Failure cause not found with id: " + id
                        )
                );
    }

    private FailureMode findFailureModeById(UUID id) {
        return failureModeRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Failure mode not found with id: " + id
                        )
                );
    }

    private void validateFailureModeExists(UUID failureModeId) {
        if (!failureModeRepository.existsById(failureModeId)) {
            throw new EntityNotFoundException(
                    "Failure mode not found with id: " + failureModeId
            );
        }
    }
}
