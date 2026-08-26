package com.sebn.pfmea.backend.function.repository;

import com.sebn.pfmea.backend.function.entity.Function;
import com.sebn.pfmea.backend.function.enums.FunctionType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FunctionRepository
        extends JpaRepository<Function, UUID> {

    List<Function> findByProcessId(UUID processId);

    List<Function> findByProcessStepId(UUID processStepId);

    List<Function> findByWorkElementId(UUID workElementId);

    List<Function> findByType(FunctionType type);
    @Query("""
    SELECT COUNT(f)
    FROM Function f
    WHERE f.process.id = :processId
       OR f.processStep.process.id = :processId
       OR f.workElement.processStep.process.id = :processId
""")
    long countByProcessScope(@Param("processId") UUID processId);

    @Query("""
    SELECT COUNT(f)
    FROM Function f
    WHERE f.processStep.id = :processStepId
       OR f.workElement.processStep.id = :processStepId
""")
    long countByProcessStepScope(@Param("processStepId") UUID processStepId);

    @Query("""
    SELECT DISTINCT f
    FROM Function f
    WHERE f.process.id = :processId
       OR f.processStep.id = :processStepId
       OR f.workElement.processStep.id = :processStepId
""")
    List<Function> findAllForProcessStepScope(
            @Param("processId") UUID processId,
            @Param("processStepId") UUID processStepId
    );
}