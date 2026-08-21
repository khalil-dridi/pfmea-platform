package com.sebn.pfmea.backend.notification.repository;

import com.sebn.pfmea.backend.notification.entity.Notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository
        extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    Optional<Notification> findByIdAndRecipientId(
            UUID notificationId,
            UUID recipientId
    );

    List<Notification> findByRecipientIdAndReadFalse(UUID recipientId);
}
