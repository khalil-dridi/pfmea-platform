package com.sebn.pfmea.backend.user.service;

import com.sebn.pfmea.backend.exception.ConflictException;
import com.sebn.pfmea.backend.exception.ResourceNotFoundException;
import com.sebn.pfmea.backend.user.dto.request.CreateUserRequest;
import com.sebn.pfmea.backend.user.dto.request.UpdateUserRequest;
import com.sebn.pfmea.backend.user.dto.response.UserResponse;
import com.sebn.pfmea.backend.user.entity.User;
import com.sebn.pfmea.backend.user.mapper.UserMapper;
import com.sebn.pfmea.backend.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email is already in use.");
        }

        User user = userMapper.toEntity(request);

        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        return userMapper.toResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {

        User user = findUserById(id);

        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with email: " + email)
                );

        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse updateUser(UUID id, UpdateUserRequest request) {

        User user = findUserById(id);

        if (request.email() != null
                && !request.email().equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmail(request.email())) {

            throw new ConflictException("Email is already in use.");
        }

        userMapper.updateEntity(user, request);

        User updatedUser = userRepository.save(user);

        return userMapper.toResponse(updatedUser);
    }

    public UserResponse disableUser(UUID id) {

        User user = findUserById(id);

        user.setEnabled(false);

        return userMapper.toResponse(userRepository.save(user));
    }

    public UserResponse enableUser(UUID id) {

        User user = findUserById(id);

        user.setEnabled(true);

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getMyProfile(UUID userId) {

        return getUserById(userId);
    }

    public UserResponse updateMyProfile(
            UUID userId,
            UpdateUserRequest request
    ) {

        User user = findUserById(userId);

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }

        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }

        User updatedUser = userRepository.save(user);

        return userMapper.toResponse(updatedUser);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {

        return userRepository.existsByEmail(email);
    }

    private User findUserById(UUID id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with id: " + id)
                );
    }
}