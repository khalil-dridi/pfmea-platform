package com.sebn.pfmea.backend.notification.service;

import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.notification.dto.response.NotificationResponse;
import com.sebn.pfmea.backend.notification.entity.Notification;
import com.sebn.pfmea.backend.notification.enums.NotificationType;
import com.sebn.pfmea.backend.notification.mapper.NotificationMapper;
import com.sebn.pfmea.backend.notification.repository.NotificationRepository;
import com.sebn.pfmea.backend.user.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public NotificationResponse createNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            String relatedEntityType,
            UUID relatedEntityId,
            String metadata
    ) {
        Notification notification = new Notification();

        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setMetadata(metadata);
        notification.setRead(false);

        Notification savedNotification =
                notificationRepository.save(notification);

        return notificationMapper.toResponse(savedNotification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(User user) {

        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    public NotificationResponse markAsRead(
            UUID notificationId,
            User user
    ) {

        Notification notification = notificationRepository
                .findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Notification not found."
                        )
                );

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
        }

        return notificationMapper.toResponse(notification);
    }

    public void markAllAsRead(User user) {

        List<Notification> notifications =
                notificationRepository.findByRecipientIdAndReadFalse(
                        user.getId()
                );

        LocalDateTime now = LocalDateTime.now();

        notifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });

        notificationRepository.saveAll(notifications);
    }
}