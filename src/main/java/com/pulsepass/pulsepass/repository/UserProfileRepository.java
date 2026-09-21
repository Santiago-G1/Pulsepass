package com.pulsepass.pulsepass.repository;

import com.pulsepass.pulsepass.domain.UserProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserEmail(String email);
}
