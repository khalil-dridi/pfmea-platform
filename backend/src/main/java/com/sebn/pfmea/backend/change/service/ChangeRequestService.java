package com.sebn.pfmea.backend.change.service;

import com.sebn.pfmea.backend.change.dto.request.ChangeRequestCreateRequest;
import com.sebn.pfmea.backend.change.dto.response.ChangeRequestResponse;
import com.sebn.pfmea.backend.change.entity.ChangeRequest;
import com.sebn.pfmea.backend.change.enums.ChangeRequestStatus;
import com.sebn.pfmea.backend.change.mapper.ChangeRequestMapper;
import com.sebn.pfmea.backend.change.repository.ChangeRequestRepository;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.notification.enums.NotificationType;
import com.sebn.pfmea.backend.notification.service.NotificationService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.enums.Role;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ChangeRequestService {

    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeRequestMapper changeRequestMapper;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ChangeRequestResponse createRequest(
            ChangeRequestCreateRequest request,
            User requester
    ) {
        ChangeRequest changeRequest = new ChangeRequest();

        changeRequest.setEntityType(request.entityType());
        changeRequest.setEntityId(request.entityId());
        changeRequest.setOperation(request.operation());
        changeRequest.setOldData(request.oldData());
        changeRequest.setNewData(request.newData());
        changeRequest.setRequestedBy(requester);
        changeRequest.setStatus(ChangeRequestStatus.PENDING);

        ChangeRequest savedRequest =
                changeRequestRepository.save(changeRequest);

        notificationService.createNotification(
                getSuperAdmin(),
                NotificationType.CHANGE_REQUEST_CREATED,
                "New validation request",
                requester.getFirstName() + " " + requester.getLastName()
                        + " submitted a change request for "
                        + request.entityType(),
                "CHANGE_REQUEST",
                savedRequest.getId(),
                null
        );

        return changeRequestMapper.toResponse(savedRequest);
    }

    @Transactional(readOnly = true)
    public List<ChangeRequestResponse> getPendingRequests() {
        return changeRequestRepository
                .findByStatusOrderByCreatedAtDesc(
                        ChangeRequestStatus.PENDING
                )
                .stream()
                .map(changeRequestMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChangeRequestResponse getRequestById(UUID id) {

        ChangeRequest changeRequest = findById(id);

        return changeRequestMapper.toResponse(changeRequest);
    }

    public ChangeRequestResponse rejectRequest(
            UUID id,
            User reviewer,
            String reviewComment
    ) {
        ChangeRequest changeRequest = findById(id);

        validatePending(changeRequest);

        changeRequest.setStatus(ChangeRequestStatus.REJECTED);
        changeRequest.setReviewedBy(reviewer);
        changeRequest.setReviewComment(reviewComment);
        changeRequest.setReviewedAt(java.time.LocalDateTime.now());

        ChangeRequest savedRequest =
                changeRequestRepository.save(changeRequest);

        notificationService.createNotification(
                changeRequest.getRequestedBy(),
                NotificationType.CHANGE_REQUEST_REJECTED,
                "Change request rejected",
                "Your change request for "
                        + changeRequest.getEntityType()
                        + " has been rejected.",
                "CHANGE_REQUEST",
                changeRequest.getId(),
                reviewComment
        );

        return changeRequestMapper.toResponse(savedRequest);
    }

    private ChangeRequest findById(UUID id) {
        return changeRequestRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Change request not found."
                        )
                );
    }

    private void validatePending(ChangeRequest changeRequest) {
        if (changeRequest.getStatus() != ChangeRequestStatus.PENDING) {
            throw new IllegalStateException(
                    "Only pending change requests can be reviewed."
            );
        }
    }

    private User getSuperAdmin() {
        return userRepository.findFirstByRole(Role.SUPER_ADMIN)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "No SUPER_ADMIN user found."
                        )
                );
    }
}
