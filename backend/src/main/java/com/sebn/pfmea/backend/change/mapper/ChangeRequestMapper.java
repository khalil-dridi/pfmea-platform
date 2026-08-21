package com.sebn.pfmea.backend.change.mapper;

import com.sebn.pfmea.backend.change.dto.response.ChangeRequestResponse;
import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ChangeRequestMapper {

    public ChangeRequestResponse toResponse(
            ChangeRequest changeRequest
    ) {
        User requestedBy = changeRequest.getRequestedBy();
        User reviewedBy = changeRequest.getReviewedBy();

        return new ChangeRequestResponse(
                changeRequest.getId(),
                changeRequest.getEntityType(),
                changeRequest.getEntityId(),
                changeRequest.getOperation(),
                changeRequest.getOldData(),
                changeRequest.getNewData(),
                requestedBy.getId(),
                getUserFullName(requestedBy),
                changeRequest.getStatus(),
                reviewedBy != null
                        ? reviewedBy.getId()
                        : null,
                reviewedBy != null
                        ? getUserFullName(reviewedBy)
                        : null,
                changeRequest.getReviewComment(),
                changeRequest.getCreatedAt(),
                changeRequest.getReviewedAt()
        );
    }

    private String getUserFullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}