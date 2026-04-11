package com.tuan.userservice.service;

import com.tuan.userservice.client.AuthServiceClient;
import com.tuan.userservice.dto.UserDTO;
import com.tuan.userservice.dto.UserProfileDTO;
import com.tuan.userservice.entity.User;
import com.tuan.userservice.entity.UserProfile;
import com.tuan.userservice.repository.UserRepository;
import com.tuan.userservice.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthServiceClient authServiceClient;

    public UserDTO getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDTO)
                .orElseGet(() -> authServiceClient.getUserById(id));
    }

    public List<UserDTO> getAllUsers() {
        return authServiceClient.getAllUsers();
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(userDTO.getName());
        user.setAge(userDTO.getAge());
        user.setGender(userDTO.getGender());
        user.setHeight(userDTO.getHeight());
        user.setWeight(userDTO.getWeight());
        user.setFitnessGoal(userDTO.getFitnessGoal());

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public UserProfileDTO getUserProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found"));
        return convertProfileToDTO(profile);
    }

    public UserProfileDTO createOrUpdateProfile(Long userId, UserProfileDTO profileDTO) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(new UserProfile());

        profile.setUserId(userId);
        profile.setBio(profileDTO.getBio());
        profile.setAvatarUrl(profileDTO.getAvatarUrl());
        profile.setFitnessLevel(profileDTO.getFitnessLevel());
        profile.setPreferredWorkoutType(profileDTO.getPreferredWorkoutType());
        profile.setWeeklyGoal(profileDTO.getWeeklyGoal());

        UserProfile savedProfile = userProfileRepository.save(profile);
        return convertProfileToDTO(savedProfile);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender());
        dto.setHeight(user.getHeight());
        dto.setWeight(user.getWeight());
        dto.setFitnessGoal(user.getFitnessGoal());
        return dto;
    }

    private UserProfileDTO convertProfileToDTO(UserProfile profile) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUserId());
        dto.setBio(profile.getBio());
        dto.setAvatarUrl(profile.getAvatarUrl());
        dto.setFitnessLevel(profile.getFitnessLevel());
        dto.setPreferredWorkoutType(profile.getPreferredWorkoutType());
        dto.setWeeklyGoal(profile.getWeeklyGoal());
        return dto;
    }
}