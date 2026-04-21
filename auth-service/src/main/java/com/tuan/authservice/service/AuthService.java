package com.tuan.authservice.service;

import com.tuan.authservice.client.UserServiceClient;
import com.tuan.authservice.dto.AdminUserDetailDTO;
import com.tuan.authservice.dto.AdminUserSummaryDTO;
import com.tuan.authservice.dto.LoginRequest;
import com.tuan.authservice.dto.PasswordResetResponseDTO;
import com.tuan.authservice.dto.RegisterRequest;
import com.tuan.authservice.dto.UserDTO;
import com.tuan.authservice.dto.UserProfileSnapshotDTO;
import com.tuan.authservice.entity.AccountStatus;
import com.tuan.authservice.entity.User;
import com.tuan.authservice.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String TEMP_PASSWORD_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%";

    private final UserRepository userRepository;
    private final UserServiceClient userServiceClient;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

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
        user.setStatus(AccountStatus.ACTIVE);
        user.setForcePasswordReset(false);

        return userRepository.save(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::convertToDTO)
                .toList();
    }

    public List<AdminUserSummaryDTO> getAdminUsers(String search, String status) {
        List<User> users;
        String normalizedSearch = search == null ? "" : search.trim();

        if (normalizedSearch.isBlank()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(normalizedSearch, normalizedSearch);
        }

        AccountStatus normalizedStatus = parseStatusFilter(status);

        return users.stream()
                .filter(user -> normalizeRole(user.getRole()).equals("USER"))
                .filter(user -> resolveStatus(user) != AccountStatus.DELETED)
                .filter(user -> normalizedStatus == null || resolveStatus(user) == normalizedStatus)
            .sorted(Comparator.comparing(User::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::convertToAdminSummary)
                .toList();
    }

    public AdminUserDetailDTO getAdminUserDetail(Long id) {
        User user = findUserById(id);
        return convertToAdminDetail(user, loadUserProfile(id));
    }

    public UserDTO getUserById(Long id) {
        User user = findUserById(id);
        ensureAccessAllowed(user);
        return convertToDTO(user);
    }

    public AdminUserSummaryDTO lockUser(Long id) {
        return updateStatus(id, AccountStatus.LOCKED);
    }

    public AdminUserSummaryDTO unlockUser(Long id) {
        User user = findUserById(id);
        ensureNotDeleted(user);
        ensureNotAdmin(user);
        user.setStatus(AccountStatus.ACTIVE);
        User savedUser = userRepository.save(user);
        return convertToAdminSummary(savedUser);
    }

    public void hardDeleteUser(Long id) {
        User user = findUserById(id);
        ensureNotAdmin(user);
        userRepository.delete(user);
    }

    public PasswordResetResponseDTO forceResetPassword(Long id) {
        User user = findUserById(id);
        ensureNotDeleted(user);
        ensureNotAdmin(user);

        String temporaryPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setForcePasswordReset(true);

        User savedUser = userRepository.save(user);

        PasswordResetResponseDTO response = new PasswordResetResponseDTO();
        response.setUser(convertToAdminDetail(savedUser, loadUserProfile(id)));
        response.setTemporaryPassword(temporaryPassword);
        return response;
    }

    public AdminUserSummaryDTO validateToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Long userId = Long.parseLong(claims.getSubject());
        User user = findUserById(userId);
        ensureAccessAllowed(user);

        return convertToAdminSummary(user);
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

        List<User> passwordMatches = candidates.stream()
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .toList();

        if (passwordMatches.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }

        User activeMatch = passwordMatches.stream()
                .filter(user -> resolveStatus(user) == AccountStatus.ACTIVE)
                .findFirst()
                .orElse(null);

        if (activeMatch != null) {
            return generateToken(activeMatch);
        }

        User lockedMatch = passwordMatches.stream()
                .filter(user -> resolveStatus(user) == AccountStatus.LOCKED)
                .findFirst()
                .orElse(null);
        if (lockedMatch != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is locked");
        }

        User deletedMatch = passwordMatches.stream()
                .filter(user -> resolveStatus(user) == AccountStatus.DELETED)
                .findFirst()
                .orElse(null);
        if (deletedMatch != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is deleted");
        }

        throw new RuntimeException("Invalid credentials");
    }

    private AdminUserSummaryDTO updateStatus(Long id, AccountStatus nextStatus) {
        User user = findUserById(id);
        ensureNotDeleted(user);
        ensureNotAdmin(user);

        user.setStatus(nextStatus);

        User savedUser = userRepository.save(user);
        return convertToAdminSummary(savedUser);
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void ensureAccessAllowed(User user) {
        AccountStatus status = resolveStatus(user);
        if (status == AccountStatus.LOCKED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is locked");
        }
        if (status == AccountStatus.DELETED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is deleted");
        }
    }

    private void ensureNotDeleted(User user) {
        if (resolveStatus(user) == AccountStatus.DELETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deleted user cannot be modified");
        }
    }

    private void ensureNotAdmin(User user) {
        if (normalizeRole(user.getRole()).equals("ADMIN")) {
            throw new ResponseStatusException(BAD_REQUEST, "Admin account is not manageable from user list");
        }
    }

    private AccountStatus resolveStatus(User user) {
        return user.getStatus() == null ? AccountStatus.ACTIVE : user.getStatus();
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "USER";
        }
        return role.toUpperCase(Locale.ROOT).replace("ROLE_", "").trim();
    }

    private AccountStatus parseStatusFilter(String status) {
        if (status == null) {
            return null;
        }

        String normalized = status.trim();
        if (normalized.isBlank() || normalized.equalsIgnoreCase("ALL")) {
            return null;
        }

        try {
            AccountStatus parsed = AccountStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
            if (parsed == AccountStatus.DELETED) {
                throw new ResponseStatusException(BAD_REQUEST, "Unsupported status. Allowed: ACTIVE, LOCKED");
            }
            return parsed;
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported status. Allowed: ACTIVE, LOCKED");
        }
    }

    private AdminUserSummaryDTO convertToAdminSummary(User user) {
        AdminUserSummaryDTO dto = new AdminUserSummaryDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setStatus(resolveStatus(user).name());
        dto.setForcePasswordReset(user.isForcePasswordReset());
        return dto;
    }

    private AdminUserDetailDTO convertToAdminDetail(User user, UserProfileSnapshotDTO profile) {
        AdminUserDetailDTO dto = new AdminUserDetailDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setStatus(resolveStatus(user).name());
        dto.setForcePasswordReset(user.isForcePasswordReset());

        if (profile != null) {
            dto.setAge(profile.getAge());
            dto.setGender(profile.getGender());
            dto.setHeight(profile.getHeight());
            dto.setWeight(profile.getWeight());
            dto.setFitnessGoal(mapGoalLabel(profile.getOnboardingGoal()));
            dto.setOnboardingGoal(profile.getOnboardingGoal());
            dto.setActivityLevel(profile.getActivityLevel());
            dto.setSpecificGoal(profile.getSpecificGoal());
            dto.setTdee(profile.getTdee());
            dto.setWeeklyGoal(profile.getWeeklyGoal());
            dto.setTargetCalories(profile.getTargetCalories());
            dto.setProteinTarget(profile.getProteinTarget());
            dto.setCarbsTarget(profile.getCarbsTarget());
            dto.setFatTarget(profile.getFatTarget());
            dto.setMealsPerDay(profile.getMealsPerDay());
        }

        return dto;
    }

    private UserProfileSnapshotDTO loadUserProfile(Long userId) {
        try {
            return userServiceClient.getUserProfile(userId);
        } catch (Exception exception) {
            return null;
        }
    }

    private String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole())
                .claim("status", resolveStatus(user).name())
                .claim("forcePasswordReset", user.isForcePasswordReset())
                .setIssuedAt(new java.util.Date())
                .setExpiration(new java.util.Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
    }

    private String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            int index = secureRandom.nextInt(TEMP_PASSWORD_CHARACTERS.length());
            builder.append(TEMP_PASSWORD_CHARACTERS.charAt(index));
        }
        return builder.toString();
    }

    private String mapGoalLabel(String goal) {
        if (goal == null || goal.isBlank()) {
            return null;
        }

        String normalized = goal.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("lose") || normalized.contains("giam")) {
            return "Giảm cân";
        }
        if (normalized.contains("build") || normalized.contains("tang") || normalized.contains("muscle")) {
            return "Tăng cơ";
        }
        if (normalized.contains("endurance") || normalized.contains("ben")) {
            return "Tăng sức bền";
        }
        if (normalized.contains("maintain") || normalized.contains("duy tri")) {
            return "Duy trì";
        }

        return goal;
    }
}
