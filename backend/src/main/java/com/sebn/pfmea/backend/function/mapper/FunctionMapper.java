package com.sebn.pfmea.backend.function.mapper;

import com.sebn.pfmea.backend.function.dto.response.FunctionResponse;
import com.sebn.pfmea.backend.function.entity.Function;
import org.springframework.stereotype.Component;

@Component
public class FunctionMapper {

    public FunctionResponse toResponse(Function function) {
        return new FunctionResponse(
                function.getId(),
                function.getType(),
                function.getDescription(),
                function.getProcess() != null
                        ? function.getProcess().getId()
                        : null,
                function.getProcessStep() != null
                        ? function.getProcessStep().getId()
                        : null,
                function.getWorkElement() != null
                        ? function.getWorkElement().getId()
                        : null
        );
    }
}