package com.sebn.pfmea.backend.function.repository;

import com.sebn.pfmea.backend.function.entity.Function;
import com.sebn.pfmea.backend.function.enums.FunctionType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FunctionRepository
        extends JpaRepository<Function, UUID> {

    List<Function> findByProcessId(UUID processId);

    List<Function> findByProcessStepId(UUID processStepId);

    List<Function> findByWorkElementId(UUID workElementId);

    List<Function> findByType(FunctionType type);
}