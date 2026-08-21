package com.sebn.pfmea.backend.user.repository;

import com.sebn.pfmea.backend.user.entity.User;
import java.util.Optional;
import java.util.UUID;

import com.sebn.pfmea.backend.user.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    Optional<User> findFirstByRole(Role role);
}
