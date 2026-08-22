package com.sebn.pfmea.backend.failureCause.repository;

import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FailureCauseRepository
        extends JpaRepository<FailureCause, UUID> {

    List<FailureCause> findByFailureModeIdOrderByIdAsc(
            UUID failureModeId
    );
}