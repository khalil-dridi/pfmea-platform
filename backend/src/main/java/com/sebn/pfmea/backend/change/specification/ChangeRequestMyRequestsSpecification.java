package com.sebn.pfmea.backend.change.specification;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestOperation;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class ChangeRequestMyRequestsSpecification {

    private ChangeRequestMyRequestsSpecification() {
    }

    public static Specification<ChangeRequest> withFilters(
            String search,
            UUID requestedById,
            ChangeRequestOperation operation,
            ChangeRequestStatus status,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            // Only requests created by the authenticated user
            predicates.add(
                    criteriaBuilder.equal(
                            root.get("requestedBy").get("id"),
                            requestedById
                    )
            );

            // Operation
            if (operation != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("operation"),
                                operation
                        )
                );
            }

            // Status
            if (status != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("status"),
                                status
                        )
                );
            }

            // From date
            if (from != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("createdAt"),
                                from
                        )
                );
            }

            // To date
            if (to != null) {
                predicates.add(
                        criteriaBuilder.lessThanOrEqualTo(
                                root.get("createdAt"),
                                to
                        )
                );
            }

            // Search
            if (search != null && !search.isBlank()) {

                String searchPattern =
                        "%" + search.trim().toLowerCase() + "%";

                predicates.add(
                        criteriaBuilder.or(
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get("entityType")
                                        ),
                                        searchPattern
                                ),
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get("operation")
                                        ),
                                        searchPattern
                                ),
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get("status")
                                        ),
                                        searchPattern
                                )
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }
}