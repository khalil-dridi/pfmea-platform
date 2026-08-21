package com.sebn.pfmea.backend.change.mapper;

import com.sebn.pfmea.backend.change.dto.response.ChangeRequestResponse;
import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import org.springframework.stereotype.Component;

@Component
public class ChangeRequestMapper {

    public ChangeRequestResponse toResponse(ChangeRequest changeRequest) {

        return new ChangeRequestResponse(
                changeRequest.getId(),
                changeRequest.getEntityType(),
                changeRequest.getEntityId(),
                changeRequest.getOperation(),
                changeRequest.getOldData(),
                changeRequest.getNewData(),
                changeRequest.getRequestedBy().getId(),
                getUserFullName(changeRequest.getRequestedBy()),
                changeRequest.getStatus(),
                changeRequest.getReviewedBy() != null
                        ? changeRequest.getReviewedBy().getId()
                        : null,
                changeRequest.getReviewedBy() != null
                        ? getUserFullName(changeRequest.getReviewedBy())
                        : null,
                changeRequest.getReviewComment(),
                changeRequest.getCreatedAt(),
                changeRequest.getReviewedAt()
        );
    }

    private String getUserFullName(
            com.sebn.pfmea.backend.user.entity.User user
    ) {
        return user.getFirstName() + " " + user.getLastName();
    }
}