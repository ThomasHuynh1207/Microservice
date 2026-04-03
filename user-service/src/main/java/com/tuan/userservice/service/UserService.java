package com.tuan.userservice.service;

import com.tuan.userservice.dto.UserDTO;
import com.tuan.userservice.dto.UserProfileDTO;
import com.tuan.userservice.entity.User;
import com.tuan.userservice.entity.UserProfile;
import com.tuan.userservice.repository.UserRepository;
import com.tuan.userservice.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(user);
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
                .orElseThrow(() -> new RuntimeException("User profile not found"));
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