package com.sebn.pfmea.backend.auth.controller;

import com.sebn.pfmea.backend.auth.dto.request.LoginRequest;
import com.sebn.pfmea.backend.auth.dto.response.LoginResponse;
import com.sebn.pfmea.backend.auth.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(
                authenticationService.login(request)
        );
    }
}