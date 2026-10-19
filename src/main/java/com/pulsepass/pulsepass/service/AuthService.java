package com.pulsepass.pulsepass.service;

import com.pulsepass.pulsepass.dto.request.LoginRequest;
import com.pulsepass.pulsepass.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);
}
