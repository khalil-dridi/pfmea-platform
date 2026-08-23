package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import com.sebn.pfmea.backend.failureCause.repository.FailureCauseRepository;
import com.sebn.pfmea.backend.riskAnalysis.dto.request.RiskAnalysisCreateRequest;
import com.sebn.pfmea.backend.riskAnalysis.dto.request.RiskAnalysisUpdateRequest;
import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import com.sebn.pfmea.backend.riskAnalysis.repository.RiskAnalysisRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class RiskAnalysisChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "RISK_ANALYSIS";

    private final RiskAnalysisRepository riskAnalysisRepository;
    private final FailureCauseRepository failureCauseRepository;
    private final JsonMapper jsonMapper;

    @Override
    public boolean supports(String entityType) {
        return ENTITY_TYPE.equalsIgnoreCase(entityType);
    }

    @Override
    @Transactional
    public UUID apply(ChangeRequest changeRequest) {

        try {
            if (changeRequest.getOperation()
                    == ChangeRequestOperation.CREATE) {

                RiskAnalysisCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                RiskAnalysisCreateRequest.class
                        );

                FailureCause failureCause =
                        failureCauseRepository.findById(
                                data.failureCauseId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Failure cause not found: "
                                                + data.failureCauseId()
                                )
                        );

                if (riskAnalysisRepository
                        .findByFailureCauseId(
                                data.failureCauseId()
                        )
                        .isPresent()) {

                    throw new IllegalStateException(
                            "A risk analysis already exists for this failure cause."
                    );
                }

                RiskAnalysis riskAnalysis =
                        new RiskAnalysis();

                riskAnalysis.setFailureCause(failureCause);
                riskAnalysis.setCurrentPreventionControl(
                        data.currentPreventionControl()
                );
                riskAnalysis.setOccurrence(
                        data.occurrence()
                );
                riskAnalysis.setCurrentDetectionControl(
                        data.currentDetectionControl()
                );
                riskAnalysis.setDetection(
                        data.detection()
                );
                riskAnalysis.setDetectionScope(
                        data.detectionScope()
                );
                riskAnalysis.setActionPriority(
                        data.actionPriority()
                );
                riskAnalysis.setSpecialProcess(
                        data.specialProcess()
                );
                riskAnalysis.setSpecialCharacteristic(
                        data.specialCharacteristic()
                );

                RiskAnalysis savedRiskAnalysis =
                        riskAnalysisRepository.save(
                                riskAnalysis
                        );

                return savedRiskAnalysis.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID riskAnalysisId =
                        changeRequest.getEntityId();

                RiskAnalysis riskAnalysis =
                        riskAnalysisRepository.findById(
                                riskAnalysisId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Risk analysis not found: "
                                                + riskAnalysisId
                                )
                        );

                RiskAnalysisUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                RiskAnalysisUpdateRequest.class
                        );

                riskAnalysis.setCurrentPreventionControl(
                        data.currentPreventionControl()
                );
                riskAnalysis.setOccurrence(
                        data.occurrence()
                );
                riskAnalysis.setCurrentDetectionControl(
                        data.currentDetectionControl()
                );
                riskAnalysis.setDetection(
                        data.detection()
                );
                riskAnalysis.setDetectionScope(
                        data.detectionScope()
                );
                riskAnalysis.setActionPriority(
                        data.actionPriority()
                );
                riskAnalysis.setSpecialProcess(
                        data.specialProcess()
                );
                riskAnalysis.setSpecialCharacteristic(
                        data.specialCharacteristic()
                );

                RiskAnalysis savedRiskAnalysis =
                        riskAnalysisRepository.save(
                                riskAnalysis
                        );

                return savedRiskAnalysis.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize risk analysis change request.",
                    exception
            );
        }
    }
}
