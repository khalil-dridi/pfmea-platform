package com.sebn.pfmea.backend.notification.controller;

import com.sebn.pfmea.backend.notification.dto.response.NotificationResponse;
import com.sebn.pfmea.backend.notification.service.NotificationService;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                notificationService.getMyNotifications(user)
        );
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                notificationService.markAsRead(id, user)
        );
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        notificationService.markAllAsRead(user);

        return ResponseEntity.noContent().build();
    }

    private User getAuthenticatedUser(Authentication authentication) {

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found."
                        )
                );
    }
}