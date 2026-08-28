package com.sebn.pfmea.backend.change.specification;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class ChangeRequestSpecification {

    private ChangeRequestSpecification() {
    }

    public static Specification<ChangeRequest> withFilters(
            String search,
            String entityType,
            UUID userId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            // Pending only
            predicates.add(
                    criteriaBuilder.equal(
                            root.get("status"),
                            ChangeRequestStatus.PENDING
                    )
            );

            // Entity type
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(
                        criteriaBuilder.equal(
                                criteriaBuilder.upper(
                                        root.get("entityType")
                                ),
                                entityType.trim().toUpperCase()
                        )
                );
            }

            // Requested by user
            if (userId != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("requestedBy").get("id"),
                                userId
                        )
                );
            }

            // Date range
            if (from != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("createdAt"),
                                from
                        )
                );
            }

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
                                                root.get("requestedBy")
                                                        .get("firstName")
                                        ),
                                        searchPattern
                                ),
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get("requestedBy")
                                                        .get("lastName")
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