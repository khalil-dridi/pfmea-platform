package com.sebn.pfmea.backend.change.service;

import com.sebn.pfmea.backend.audit.enums.AuditAction;
import com.sebn.pfmea.backend.audit.service.AuditLogService;
import com.sebn.pfmea.backend.change.applier.ChangeApplier;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ChangeRequestService {

    private static final String CHANGE_REQUEST_ENTITY_TYPE = "CHANGE_REQUEST";

    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeRequestMapper changeRequestMapper;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final List<ChangeApplier> changeAppliers;

    /**
     * Creates a pending change request submitted by an ADMIN.
     */
    public ChangeRequestResponse createRequest(
            ChangeRequestCreateRequest request,
            User requester
    ) {
        validateAdminRequester(requester);

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

        notifySuperAdmin(savedRequest, requester);

        return changeRequestMapper.toResponse(savedRequest);
    }

    /**
     * SUPER_ADMIN only:
     * Returns all pending change requests.
     */
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

    /**
     * ADMIN:
     * Returns only the requests submitted by the current ADMIN.
     *
     * SUPER_ADMIN:
     * Can retrieve any request.
     */
    @Transactional(readOnly = true)
    public ChangeRequestResponse getRequestById(
            UUID id,
            User currentUser
    ) {
        ChangeRequest changeRequest = findById(id);

        validateRequestAccess(changeRequest, currentUser);

        return changeRequestMapper.toResponse(changeRequest);
    }

    /**
     * ADMIN:
     * Returns only his own requests.
     */
    @Transactional(readOnly = true)
    public List<ChangeRequestResponse> getMyRequests(User currentUser) {

        validateAdminRequester(currentUser);

        return changeRequestRepository
                .findByRequestedByIdOrderByCreatedAtDesc(
                        currentUser.getId()
                )
                .stream()
                .map(changeRequestMapper::toResponse)
                .toList();
    }

    /**
     * SUPER_ADMIN only:
     * Approves a pending change request.
     */
    public ChangeRequestResponse approveRequest(
            UUID id,
            User reviewer,
            String reviewComment
    ) {
        validateSuperAdmin(reviewer);

        ChangeRequest changeRequest = findById(id);

        validatePending(changeRequest);

        ChangeApplier applier =
                getApplier(changeRequest.getEntityType());

        UUID appliedEntityId = applier.apply(changeRequest);

        changeRequest.setEntityId(appliedEntityId);
        changeRequest.setStatus(ChangeRequestStatus.APPROVED);
        changeRequest.setReviewedBy(reviewer);
        changeRequest.setReviewComment(reviewComment);
        changeRequest.setReviewedAt(LocalDateTime.now());

        ChangeRequest savedRequest =
                changeRequestRepository.save(changeRequest);

        auditLogService.createAuditLog(
                changeRequest.getEntityType(),
                appliedEntityId,
                AuditAction.APPROVE,
                changeRequest.getOldData(),
                changeRequest.getNewData(),
                reviewer
        );

        notificationService.createNotification(
                changeRequest.getRequestedBy(),
                NotificationType.CHANGE_REQUEST_APPROVED,
                "Change request approved",
                "Your change request for "
                        + changeRequest.getEntityType()
                        + " has been approved.",
                CHANGE_REQUEST_ENTITY_TYPE,
                changeRequest.getId(),
                reviewComment
        );

        return changeRequestMapper.toResponse(savedRequest);
    }

    /**
     * SUPER_ADMIN only:
     * Rejects a pending change request.
     */
    public ChangeRequestResponse rejectRequest(
            UUID id,
            User reviewer,
            String reviewComment
    ) {
        validateSuperAdmin(reviewer);

        ChangeRequest changeRequest = findById(id);

        validatePending(changeRequest);

        changeRequest.setStatus(ChangeRequestStatus.REJECTED);
        changeRequest.setReviewedBy(reviewer);
        changeRequest.setReviewComment(reviewComment);
        changeRequest.setReviewedAt(LocalDateTime.now());

        ChangeRequest savedRequest =
                changeRequestRepository.save(changeRequest);

        auditLogService.createAuditLog(
                CHANGE_REQUEST_ENTITY_TYPE,
                changeRequest.getId(),
                AuditAction.REJECT,
                changeRequest.getOldData(),
                changeRequest.getNewData(),
                reviewer
        );

        notificationService.createNotification(
                changeRequest.getRequestedBy(),
                NotificationType.CHANGE_REQUEST_REJECTED,
                "Change request rejected",
                "Your change request for "
                        + changeRequest.getEntityType()
                        + " has been rejected.",
                CHANGE_REQUEST_ENTITY_TYPE,
                changeRequest.getId(),
                reviewComment
        );

        return changeRequestMapper.toResponse(savedRequest);
    }

    /**
     * Sends a notification to a SUPER_ADMIN when an ADMIN
     * submits a new change request.
     */
    private void notifySuperAdmin(
            ChangeRequest changeRequest,
            User requester
    ) {
        User superAdmin = getSuperAdmin();

        notificationService.createNotification(
                superAdmin,
                NotificationType.CHANGE_REQUEST_CREATED,
                "New validation request",
                requester.getFirstName()
                        + " "
                        + requester.getLastName()
                        + " submitted a change request for "
                        + changeRequest.getEntityType(),
                CHANGE_REQUEST_ENTITY_TYPE,
                changeRequest.getId(),
                null
        );
    }

    /**
     * Finds the appropriate applier for the requested entity type.
     */
    private ChangeApplier getApplier(String entityType) {
        return changeAppliers.stream()
                .filter(applier -> applier.supports(entityType))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalStateException(
                                "No ChangeApplier found for entity type: "
                                        + entityType
                        )
                );
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
        if (changeRequest.getStatus()
                != ChangeRequestStatus.PENDING) {

            throw new IllegalStateException(
                    "Only pending change requests can be reviewed."
            );
        }
    }

    private void validateSuperAdmin(User user) {
        if (user.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException(
                    "Only SUPER_ADMIN can review change requests."
            );
        }
    }

    private void validateAdminRequester(User user) {
        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException(
                    "Only ADMIN can submit change requests."
            );
        }
    }

    private void validateRequestAccess(
            ChangeRequest changeRequest,
            User currentUser
    ) {
        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.ADMIN
                && changeRequest.getRequestedBy()
                .getId()
                .equals(currentUser.getId())) {
            return;
        }

        throw new AccessDeniedException(
                "You are not allowed to access this change request."
        );
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