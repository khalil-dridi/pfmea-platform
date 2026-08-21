package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.process.repository.ProcessRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class ProcessChangeApplier implements ChangeApplier {

    private static final String ENTITY_TYPE = "PROCESS";

    private final ProcessRepository processRepository;
    private final JsonMapper jsonMapper;

    @Override
    public boolean supports(String entityType) {
        return ENTITY_TYPE.equalsIgnoreCase(entityType);
    }

    @Override
    @Transactional
    public UUID apply(ChangeRequest changeRequest) {

        try {
            if (changeRequest.getOperation() == ChangeRequestOperation.CREATE) {

                Process process = jsonMapper.readValue(
                        changeRequest.getNewData(),
                        Process.class
                );

                // The database generates the ID.
                process.setId(null);

                Process savedProcess = processRepository.save(process);

                return savedProcess.getId();
            }

            if (changeRequest.getOperation() == ChangeRequestOperation.UPDATE) {

                UUID processId = changeRequest.getEntityId();

                Process process = processRepository.findById(processId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Process not found: " + processId
                                )
                        );

                Process updatedProcess = jsonMapper.readValue(
                        changeRequest.getNewData(),
                        Process.class
                );

                process.setName(updatedProcess.getName());
                process.setProcessNumber(updatedProcess.getProcessNumber());

                Process savedProcess = processRepository.save(process);

                return savedProcess.getId();
            }

            throw new IllegalStateException(
                    "Unsupported change operation: "
                            + changeRequest.getOperation()
            );

        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to deserialize process change request.",
                    exception
            );
        }
    }
}