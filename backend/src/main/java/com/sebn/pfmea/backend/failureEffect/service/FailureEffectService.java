package com.sebn.pfmea.backend.failureEffect.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.failureEffect.dto.request.FailureEffectCreateRequest;
import com.sebn.pfmea.backend.failureEffect.dto.request.FailureEffectUpdateRequest;
import com.sebn.pfmea.backend.failureEffect.dto.response.FailureEffectResponse;
import com.sebn.pfmea.backend.failureEffect.dto.snapshot.FailureEffectSnapshot;
import com.sebn.pfmea.backend.failureEffect.entity.FailureEffect;
import com.sebn.pfmea.backend.failureEffect.mapper.FailureEffectMapper;
import com.sebn.pfmea.backend.failureEffect.repository.FailureEffectRepository;
import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
import com.sebn.pfmea.backend.failureMode.repository.FailureModeRepository;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.enums.Role;
import jakarta.persistence.EntityNotFoundException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
@Transactional
public class FailureEffectService {

    private static final String ENTITY_TYPE = "FAILURE_EFFECT";

    private final FailureEffectRepository failureEffectRepository;
    private final FailureModeRepository failureModeRepository;
    private final FailureEffectMapper failureEffectMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public FailureEffectResponse getFailureEffectByFailureMode(
            UUID failureModeId
    ) {
        validateFailureModeExists(failureModeId);

        return failureEffectRepository
                .findByFailureModeId(failureModeId)
                .map(failureEffectMapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public FailureEffectResponse getFailureEffectById(UUID id) {
        return failureEffectMapper.toResponse(findById(id));
    }

    public FailureEffectResponse createFailureEffect(
            FailureEffectCreateRequest request,
            User currentUser
    ) {
        FailureMode failureMode =
                findFailureModeById(request.failureModeId());

        if (failureEffectRepository
                .findByFailureModeId(request.failureModeId())
                .isPresent()) {

            throw new IllegalStateException(
                    "A failure effect already exists for this failure mode."
            );
        }

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

        FailureEffect failureEffect =
                new FailureEffect();

        failureEffect.setFailureMode(failureMode);
        failureEffect.setOurPlant(request.ourPlant());
        failureEffect.setShipToPlant(request.shipToPlant());
        failureEffect.setEndUser(request.endUser());
        failureEffect.setSeverity(request.severity());

        FailureEffect savedFailureEffect =
                failureEffectRepository.save(failureEffect);

        return failureEffectMapper.toResponse(
                savedFailureEffect
        );
    }

    public FailureEffectResponse updateFailureEffect(
            UUID id,
            FailureEffectUpdateRequest request,
            User currentUser
    ) {
        FailureEffect existingFailureEffect =
                findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            FailureEffectSnapshot oldData =
                    new FailureEffectSnapshot(
                            existingFailureEffect.getId(),
                            existingFailureEffect.getFailureMode().getId(),
                            existingFailureEffect.getOurPlant(),
                            existingFailureEffect.getShipToPlant(),
                            existingFailureEffect.getEndUser(),
                            existingFailureEffect.getSeverity()
                    );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return failureEffectMapper.toResponse(
                    existingFailureEffect
            );
        }

        existingFailureEffect.setOurPlant(
                request.ourPlant()
        );

        existingFailureEffect.setShipToPlant(
                request.shipToPlant()
        );

        existingFailureEffect.setEndUser(
                request.endUser()
        );

        existingFailureEffect.setSeverity(
                request.severity()
        );

        FailureEffect savedFailureEffect =
                failureEffectRepository.save(
                        existingFailureEffect
                );

        return failureEffectMapper.toResponse(
                savedFailureEffect
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
                    "Unable to create the failure effect change request.",
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

    private FailureEffect findById(UUID id) {
        return failureEffectRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Failure effect not found with id: " + id
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

    private void validateFailureModeExistsForCreation(
            UUID failureModeId
    ) {
        validateFailureModeExists(failureModeId);

        if (failureEffectRepository
                .findByFailureModeId(failureModeId)
                .isPresent()) {

            throw new IllegalStateException(
                    "A failure effect already exists for this failure mode."
            );
        }
    }
}
