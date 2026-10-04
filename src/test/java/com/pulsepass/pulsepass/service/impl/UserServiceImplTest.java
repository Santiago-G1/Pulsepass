package com.pulsepass.pulsepass.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.pulsepass.domain.User;
import com.pulsepass.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.pulsepass.dto.response.UserResponse;
import com.pulsepass.pulsepass.exception.BusinessRuleException;
import com.pulsepass.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.pulsepass.mapper.UserMapper;
import com.pulsepass.pulsepass.repository.UserRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, userMapper);
    }

    @Test
    void registerPersistsActiveUserAndProfile() {
        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserResponse response = response();
        when(userMapper.toResponse(any(User.class))).thenReturn(response);

        assertThat(userService.register(request(LocalDate.now().minusYears(25))))
                .isSameAs(response);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isTrue();
        assertThat(captor.getValue().getProfile().getBirthDate())
                .isEqualTo(LocalDate.now().minusYears(25));
    }

    @Test
    void registerRejectsDuplicateUsername() {
        when(userRepository.existsByUsername("andrea")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request(LocalDate.now().minusYears(25))))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerRejectsCaseInsensitiveDuplicateEmail() {
        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request(LocalDate.now().minusYears(25))))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerRejectsFutureBirthDate() {
        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@example.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.register(request(LocalDate.now().plusDays(1))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Birth date");

        verify(userRepository, never()).save(any(User.class));
    }

    private RegisterUserRequest request(LocalDate birthDate) {
        return new RegisterUserRequest("andrea", "andrea@example.com",
                "Andrea", "Gomez", "3000000000", "Santa Marta", birthDate);
    }

    private UserResponse response() {
        return new UserResponse(null, "andrea", "andrea@example.com", true,
                "Andrea", "Gomez", "3000000000", "Santa Marta",
                LocalDate.now().minusYears(25));
    }
}
