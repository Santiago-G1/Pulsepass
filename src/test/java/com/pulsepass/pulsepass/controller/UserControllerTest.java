package com.pulsepass.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.pulsepass.dto.response.UserResponse;
import com.pulsepass.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.pulsepass.service.UserService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
class UserControllerTest {

    private static final String REGISTER_JSON = """
            {
              "username": "andrea",
              "email": "andrea@example.com",
              "firstName": "Andrea",
              "lastName": "Garcia",
              "phone": "3001234567",
              "city": "Santa Marta",
              "birthDate": "1990-01-01"
            }
            """;

    private static final UserResponse USER = new UserResponse(1L, "andrea",
            "andrea@example.com", true, "Andrea", "Garcia", "3001234567", "Santa Marta",
            LocalDate.of(1990, 1, 1));

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void registerValidReturns201() throws Exception {
        when(userService.register(any(RegisterUserRequest.class))).thenReturn(USER);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REGISTER_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.email").value("andrea@example.com"));

        verify(userService).register(any(RegisterUserRequest.class));
    }

    @Test
    void registerInvalidEmailReturns400AndNeverCallsService() throws Exception {
        String invalidJson = """
                {
                  "username": "andrea",
                  "email": "not-an-email",
                  "firstName": "Andrea",
                  "lastName": "Garcia",
                  "birthDate": "1990-01-01"
                }
                """;

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.email").exists());

        verify(userService, never()).register(any());
    }

    @Test
    void registerDuplicateUsernameReturns409() throws Exception {
        when(userService.register(any(RegisterUserRequest.class))).thenThrow(
                new DuplicateResourceException("Username already exists: andrea"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REGISTER_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Username already exists: andrea"));
    }

    @Test
    void findByEmailReturns200() throws Exception {
        when(userService.findByEmail("andrea@example.com")).thenReturn(USER);

        mockMvc.perform(get("/api/users/by-email").param("email", "andrea@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").value("andrea@example.com"));

        verify(userService).findByEmail("andrea@example.com");
    }

    @Test
    void findByUsernameReturns200() throws Exception {
        when(userService.findByUsername("andrea")).thenReturn(USER);

        mockMvc.perform(get("/api/users/by-username").param("username", "andrea"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("andrea"));

        verify(userService).findByUsername("andrea");
    }
}
