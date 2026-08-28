package com.sebn.pfmea.backend.audit.specification;

import com.sebn.pfmea.backend.audit.entity.AuditLog;
import com.sebn.pfmea.backend.audit.enums.AuditAction;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class AuditLogSpecification {

    private AuditLogSpecification() {
    }

    public static Specification<AuditLog> withFilters(
            String search,
            String entityType,
            AuditAction action,
            UUID userId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (entityType != null && !entityType.isBlank()) {
                predicates.add(
                        criteriaBuilder.equal(
                                criteriaBuilder.upper(root.get("entityType")),
                                entityType.trim().toUpperCase()
                        )
                );
            }

            if (action != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("action"),
                                action
                        )
                );
            }

            if (userId != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("performedBy").get("id"),
                                userId
                        )
                );
            }

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

            if (search != null && !search.isBlank()) {

                String searchPattern = "%" + search.trim().toLowerCase() + "%";

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
                                                root.get("performedBy")
                                                        .get("firstName")
                                        ),
                                        searchPattern
                                ),
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get("performedBy")
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
