package com.sebn.pfmea.backend.user.controller;

import com.sebn.pfmea.backend.user.dto.response.UserResponse;
import com.sebn.pfmea.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(
            Authentication authentication
    ) {
        UserResponse response = userService.getUserByEmail(
                authentication.getName()
        );

        return ResponseEntity.ok(response);
    }
}