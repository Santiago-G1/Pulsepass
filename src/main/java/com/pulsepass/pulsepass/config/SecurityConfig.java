package com.pulsepass.pulsepass.config;

import com.pulsepass.pulsepass.repository.UserRepository;
import com.pulsepass.pulsepass.security.PulsePassUserPrincipal;
import com.pulsepass.pulsepass.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(ApplicationContext applicationContext) {
        return identifier -> {
            UserRepository userRepository = applicationContext.getBeanProvider(UserRepository.class)
                    .getIfAvailable();
            if (userRepository == null) {
                throw new UsernameNotFoundException("User repository unavailable");
            }
            return userRepository.findByUsernameIgnoreCase(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .map(PulsePassUserPrincipal::from)
                    .orElseThrow(() -> new UsernameNotFoundException(
                            "User not found: " + identifier));
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/users").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/venues/**", "/api/events/**",
                                "/api/artists/**", "/api/users/**", "/api/tickets/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/events", "/api/tickets").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/events/**", "/api/tickets/**").permitAll()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Unauthorized\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Forbidden\"}");
                        }));
        return http.build();
    }

    @Component
    public static class JwtAuthenticationFilter extends OncePerRequestFilter {

        private final JwtService jwtService;

        public JwtAuthenticationFilter(@org.springframework.beans.factory.annotation.Autowired(required = false)
                JwtService jwtService) {
            this.jwtService = jwtService;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                FilterChain filterChain) throws ServletException, IOException {
            if (jwtService == null) {
                filterChain.doFilter(request, response);
                return;
            }

            String authorization = request.getHeader("Authorization");
            if (authorization != null && authorization.startsWith("Bearer ")) {
                String token = authorization.substring(7);
                if (jwtService.isTokenValid(token)) {
                    Claims claims = jwtService.parseClaims(token);
                    Long userId = jwtService.getUserId(token);
                    String username = String.valueOf(claims.get("username"));
                    String email = String.valueOf(claims.get("email"));
                    List<?> roles = claims.get("roles", List.class);
                    List<GrantedAuthority> authorities = roles == null ? List.<GrantedAuthority>of()
                            : roles.stream()
                                    .map(Object::toString)
                                    .map(SimpleGrantedAuthority::new)
                                    .map(GrantedAuthority.class::cast)
                                    .toList();
                    var principal = new PulsePassUserPrincipal(userId, username, email, "",
                            true, authorities);
                    var authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    org.springframework.security.core.context.SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                }
            }
            filterChain.doFilter(request, response);
        }
    }
}
