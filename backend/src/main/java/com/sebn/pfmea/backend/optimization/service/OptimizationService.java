package com.sebn.pfmea.backend.optimization.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.service.ChangeRequestService;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationCreateRequest;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationUpdateRequest;
import com.sebn.pfmea.backend.optimization.dto.response.OptimizationResponse;
import com.sebn.pfmea.backend.optimization.dto.snapshot.OptimizationSnapshot;
import com.sebn.pfmea.backend.optimization.entity.Optimization;
import com.sebn.pfmea.backend.optimization.mapper.OptimizationMapper;
import com.sebn.pfmea.backend.optimization.repository.OptimizationRepository;
import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
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
public class OptimizationService {

    private static final String ENTITY_TYPE = "OPTIMIZATION";

    private final OptimizationRepository optimizationRepository;
    private final RiskAnalysisRepository riskAnalysisRepository;
    private final OptimizationMapper optimizationMapper;
    private final ChangeRequestService changeRequestService;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public OptimizationResponse getOptimizationByRiskAnalysis(
            UUID riskAnalysisId
    ) {
        validateRiskAnalysisExists(riskAnalysisId);

        return optimizationRepository
                .findByRiskAnalysisId(riskAnalysisId)
                .map(optimizationMapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public OptimizationResponse getOptimizationById(UUID id) {
        return optimizationMapper.toResponse(findById(id));
    }

    public OptimizationResponse createOptimization(
            OptimizationCreateRequest request,
            User currentUser
    ) {
        RiskAnalysis riskAnalysis =
                findRiskAnalysisById(request.riskAnalysisId());

        if (optimizationRepository
                .findByRiskAnalysisId(request.riskAnalysisId())
                .isPresent()) {

            throw new IllegalStateException(
                    "An optimization already exists for this risk analysis."
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

        Optimization optimization =
                new Optimization();

        optimization.setRiskAnalysis(riskAnalysis);
        optimization.setSeverity(request.severity());
        optimization.setOccurrence(request.occurrence());
        optimization.setDetection(request.detection());
        optimization.setActionPriority(request.actionPriority());
        optimization.setSpecialProcess(request.specialProcess());
        optimization.setSpecialCharacteristic(
                request.specialCharacteristic()
        );
        optimization.setRemarks(request.remarks());

        Optimization savedOptimization =
                optimizationRepository.save(optimization);

        return optimizationMapper.toResponse(
                savedOptimization
        );
    }

    public OptimizationResponse updateOptimization(
            UUID id,
            OptimizationUpdateRequest request,
            User currentUser
    ) {
        Optimization existingOptimization =
                findById(id);

        if (currentUser.getRole() == Role.ADMIN) {

            OptimizationSnapshot oldData =
                    new OptimizationSnapshot(
                            existingOptimization.getId(),
                            existingOptimization.getRiskAnalysis().getId(),
                            existingOptimization.getSeverity(),
                            existingOptimization.getOccurrence(),
                            existingOptimization.getDetection(),
                            existingOptimization.getActionPriority(),
                            existingOptimization.getSpecialProcess(),
                            existingOptimization.getSpecialCharacteristic(),
                            existingOptimization.getRemarks()
                    );

            createChangeRequest(
                    ChangeRequestOperation.UPDATE,
                    id,
                    oldData,
                    request,
                    currentUser
            );

            return optimizationMapper.toResponse(
                    existingOptimization
            );
        }

        existingOptimization.setSeverity(
                request.severity()
        );
        existingOptimization.setOccurrence(
                request.occurrence()
        );
        existingOptimization.setDetection(
                request.detection()
        );
        existingOptimization.setActionPriority(
                request.actionPriority()
        );
        existingOptimization.setSpecialProcess(
                request.specialProcess()
        );
        existingOptimization.setSpecialCharacteristic(
                request.specialCharacteristic()
        );
        existingOptimization.setRemarks(
                request.remarks()
        );

        Optimization savedOptimization =
                optimizationRepository.save(
                        existingOptimization
                );

        return optimizationMapper.toResponse(
                savedOptimization
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
                    "Unable to create the optimization change request.",
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

    private Optimization findById(UUID id) {
        return optimizationRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Optimization not found with id: " + id
                        )
                );
    }

    private RiskAnalysis findRiskAnalysisById(UUID id) {
        return riskAnalysisRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Risk analysis not found with id: " + id
                        )
                );
    }

    private void validateRiskAnalysisExists(UUID riskAnalysisId) {
        if (!riskAnalysisRepository.existsById(riskAnalysisId)) {
            throw new EntityNotFoundException(
                    "Risk analysis not found with id: " + riskAnalysisId
            );
        }
    }
}
