package com.sebn.pfmea.backend.change.repository;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ChangeRequestRepository
        extends JpaRepository<ChangeRequest, UUID>,
        JpaSpecificationExecutor<ChangeRequest> {

    List<ChangeRequest> findByStatusOrderByCreatedAtDesc(
            ChangeRequestStatus status
    );

    List<ChangeRequest> findByRequestedByIdOrderByCreatedAtDesc(
            UUID requestedById
    );

    long countByStatus(ChangeRequestStatus status);
}