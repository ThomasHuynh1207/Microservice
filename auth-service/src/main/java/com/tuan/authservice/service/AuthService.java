package com.tuan.authservice.service;

import com.tuan.authservice.dto.LoginRequest;
import com.tuan.authservice.dto.RegisterRequest;
import com.tuan.authservice.dto.UserDTO;
import com.tuan.authservice.entity.User;
import com.tuan.authservice.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public User register(RegisterRequest request) {
        String normalizedEmail = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (normalizedEmail.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        if (!userRepository.findAllByEmailIgnoreCase(normalizedEmail).isEmpty()) {
            throw new RuntimeException("User already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        return userRepository.save(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserDTO> getAdminUsers(String search) {
        List<User> users;
        if (search == null || search.isBlank()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(search, search);
        }

        return users.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(user);
    }

    public UserDTO updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String normalizedRole = normalizeRole(role);
        if (!List.of("USER", "ADMIN").contains(normalizedRole)) {
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported role. Allowed: USER, ADMIN");
        }

        user.setRole(normalizedRole);
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public UserDTO validateToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Long userId = Long.parseLong(claims.getSubject());
        return getUserById(userId);
    }

    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        return dto;
    }

    public String login(LoginRequest request) {
        String normalizedEmail = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        List<User> candidates = userRepository.findAllByEmailIgnoreCase(normalizedEmail);
        if (candidates.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User matchedUser = candidates.stream()
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        return generateToken(matchedUser);
    }

    private String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
    }

    private String normalizeRole(String role) {
        return role.toUpperCase(Locale.ROOT).replace("ROLE_", "").trim();
    }
}