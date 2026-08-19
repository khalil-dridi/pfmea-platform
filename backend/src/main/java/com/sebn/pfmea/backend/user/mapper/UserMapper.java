package com.sebn.pfmea.backend.user.mapper;

import com.sebn.pfmea.backend.user.dto.request.CreateUserRequest;
import com.sebn.pfmea.backend.user.dto.request.UpdateUserRequest;
import com.sebn.pfmea.backend.user.dto.response.UserResponse;
import com.sebn.pfmea.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(CreateUserRequest request) {
        User user = new User();
        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(request.role());
        return user;
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public void updateEntity(User user, UpdateUserRequest request) {
        if (request.email() != null) {
            user.setEmail(request.email());
        }

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }

        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }

        if (request.role() != null) {
            user.setRole(request.role());
        }
    }
}
