package com.sebn.pfmea.backend.riskAnalysis.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import com.sebn.pfmea.backend.failureCause.repository.FailureCauseRepository;
import com.sebn.pfmea.backend.riskAnalysis.dto.request.RiskAnalysisCreateRequest;
import com.sebn.pfmea.backend.riskAnalysis.dto.request.RiskAnalysisUpdateRequest;
import com.sebn.pfmea.backend.riskAnalysis.dto.response.RiskAnalysisResponse;
import com.sebn.pfmea.backend.riskAnalysis.dto.snapshot.RiskAnalysisSnapshot;
import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import com.sebn.pfmea.backend.riskAnalysis.mapper.RiskAnalysisMapper;
import com.sebn.pfmea.backend.riskAnalysis.repository.RiskAnalysisRepository;
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
public class RiskAnalysisService {

    private static final String ENTITY_TYPE = "RISK_ANALYSIS";

    private final RiskAnalysisRepository riskAnalysisRepository;
    private final FailureCauseRepository failureCauseRepository;
    private final RiskAnalysisMapper riskAnalysisMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public RiskAnalysisResponse getRiskAnalysisByFailureCause(
            UUID failureCauseId
    ) {
        validateFailureCauseExists(failureCauseId);

        return riskAnalysisRepository
                .findByFailureCauseId(failureCauseId)
                .map(riskAnalysisMapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public RiskAnalysisResponse getRiskAnalysisById(UUID id) {
        return riskAnalysisMapper.toResponse(findById(id));
    }

    public RiskAnalysisResponse createRiskAnalysis(
            RiskAnalysisCreateRequest request,
            User currentUser
    ) {
        FailureCause failureCause =
                findFailureCauseById(request.failureCauseId());

        if (riskAnalysisRepository
                .findByFailureCauseId(request.failureCauseId())
                .isPresent()) {

            throw new IllegalStateException(
                    "A risk analysis already exists for this failure cause."
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

        RiskAnalysis riskAnalysis =
                new RiskAnalysis();

        riskAnalysis.setFailureCause(failureCause);
        riskAnalysis.setCurrentPreventionControl(
                request.currentPreventionControl()
        );
        riskAnalysis.setOccurrence(
                request.occurrence()
        );
        riskAnalysis.setCurrentDetectionControl(
                request.currentDetectionControl()
        );
        riskAnalysis.setDetection(
                request.detection()
        );
        riskAnalysis.setDetectionScope(
                request.detectionScope()
        );
        riskAnalysis.setActionPriority(
                request.actionPriority()
        );
        riskAnalysis.setSpecialProcess(
                request.specialProcess()
        );
        riskAnalysis.setSpecialCharacteristic(
                request.specialCharacteristic()
        );

        RiskAnalysis savedRiskAnalysis =
                riskAnalysisRepository.save(riskAnalysis);

        return riskAnalysisMapper.toResponse(
                savedRiskAnalysis
        );
    }

    public RiskAnalysisResponse updateRiskAnalysis(
            UUID id,
            RiskAnalysisUpdateRequest request,
            User currentUser
    ) {
        RiskAnalysis existingRiskAnalysis =
                findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            RiskAnalysisSnapshot oldData =
                    new RiskAnalysisSnapshot(
                            existingRiskAnalysis.getId(),
                            existingRiskAnalysis.getFailureCause().getId(),
                            existingRiskAnalysis.getCurrentPreventionControl(),
                            existingRiskAnalysis.getOccurrence(),
                            existingRiskAnalysis.getCurrentDetectionControl(),
                            existingRiskAnalysis.getDetection(),
                            existingRiskAnalysis.getDetectionScope(),
                            existingRiskAnalysis.getActionPriority(),
                            existingRiskAnalysis.getSpecialProcess(),
                            existingRiskAnalysis.getSpecialCharacteristic()
                    );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return riskAnalysisMapper.toResponse(
                    existingRiskAnalysis
            );
        }

        existingRiskAnalysis.setCurrentPreventionControl(
                request.currentPreventionControl()
        );
        existingRiskAnalysis.setOccurrence(
                request.occurrence()
        );
        existingRiskAnalysis.setCurrentDetectionControl(
                request.currentDetectionControl()
        );
        existingRiskAnalysis.setDetection(
                request.detection()
        );
        existingRiskAnalysis.setDetectionScope(
                request.detectionScope()
        );
        existingRiskAnalysis.setActionPriority(
                request.actionPriority()
        );
        existingRiskAnalysis.setSpecialProcess(
                request.specialProcess()
        );
        existingRiskAnalysis.setSpecialCharacteristic(
                request.specialCharacteristic()
        );

        RiskAnalysis savedRiskAnalysis =
                riskAnalysisRepository.save(
                        existingRiskAnalysis
                );

        return riskAnalysisMapper.toResponse(
                savedRiskAnalysis
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
                    "Unable to create the risk analysis change request.",
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

    private RiskAnalysis findById(UUID id) {
        return riskAnalysisRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Risk analysis not found with id: " + id
                        )
                );
    }

    private FailureCause findFailureCauseById(UUID id) {
        return failureCauseRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Failure cause not found with id: " + id
                        )
                );
    }

    private void validateFailureCauseExists(UUID failureCauseId) {
        if (!failureCauseRepository.existsById(failureCauseId)) {
            throw new EntityNotFoundException(
                    "Failure cause not found with id: " + failureCauseId
            );
        }
    }
}
