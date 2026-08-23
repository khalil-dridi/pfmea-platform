package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationCreateRequest;
import com.sebn.pfmea.backend.optimization.dto.request.OptimizationUpdateRequest;
import com.sebn.pfmea.backend.optimization.entity.Optimization;
import com.sebn.pfmea.backend.optimization.repository.OptimizationRepository;
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
public class OptimizationChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "OPTIMIZATION";

    private final OptimizationRepository optimizationRepository;
    private final RiskAnalysisRepository riskAnalysisRepository;
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

                OptimizationCreateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                OptimizationCreateRequest.class
                        );

                RiskAnalysis riskAnalysis =
                        riskAnalysisRepository.findById(
                                data.riskAnalysisId()
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Risk analysis not found: "
                                                + data.riskAnalysisId()
                                )
                        );

                if (optimizationRepository
                        .findByRiskAnalysisId(
                                data.riskAnalysisId()
                        )
                        .isPresent()) {

                    throw new IllegalStateException(
                            "An optimization already exists for this risk analysis."
                    );
                }

                Optimization optimization =
                        new Optimization();

                optimization.setRiskAnalysis(riskAnalysis);
                optimization.setSeverity(data.severity());
                optimization.setOccurrence(data.occurrence());
                optimization.setDetection(data.detection());
                optimization.setActionPriority(data.actionPriority());
                optimization.setSpecialProcess(
                        data.specialProcess()
                );
                optimization.setSpecialCharacteristic(
                        data.specialCharacteristic()
                );
                optimization.setRemarks(
                        data.remarks()
                );

                Optimization savedOptimization =
                        optimizationRepository.save(
                                optimization
                        );

                return savedOptimization.getId();
            }

            if (changeRequest.getOperation()
                    == ChangeRequestOperation.UPDATE) {

                UUID optimizationId =
                        changeRequest.getEntityId();

                Optimization optimization =
                        optimizationRepository.findById(
                                optimizationId
                        ).orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Optimization not found: "
                                                + optimizationId
                                )
                        );

                OptimizationUpdateRequest data =
                        jsonMapper.readValue(
                                changeRequest.getNewData(),
                                OptimizationUpdateRequest.class
                        );

                optimization.setSeverity(data.severity());
                optimization.setOccurrence(data.occurrence());
                optimization.setDetection(data.detection());
                optimization.setActionPriority(
                        data.actionPriority()
                );
                optimization.setSpecialProcess(
                        data.specialProcess()
                );
                optimization.setSpecialCharacteristic(
                        data.specialCharacteristic()
                );
                optimization.setRemarks(data.remarks());

                Optimization savedOptimization =
                        optimizationRepository.save(
                                optimization
                        );

                return savedOptimization.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize optimization change request.",
                    exception
            );
        }
    }
}
