package com.tuan.userservice.service;

import com.tuan.userservice.client.AuthServiceClient;
import com.tuan.userservice.client.NutritionServiceClient;
import com.tuan.userservice.dto.MealPlanGenerateRequest;
import com.tuan.userservice.dto.NutritionProfileDTO;
import com.tuan.userservice.dto.UserDTO;
import com.tuan.userservice.dto.UserProfileDTO;
import com.tuan.userservice.entity.User;
import com.tuan.userservice.entity.UserProfile;
import com.tuan.userservice.repository.UserProfileRepository;
import com.tuan.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthServiceClient authServiceClient;
    private final NutritionServiceClient nutritionServiceClient;

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
        profile.setTargetCalories(profileDTO.getTargetCalories());
        profile.setProteinTarget(profileDTO.getProteinTarget());
        profile.setCarbsTarget(profileDTO.getCarbsTarget());
        profile.setFatTarget(profileDTO.getFatTarget());
        profile.setMealsPerDay(profileDTO.getMealsPerDay());
        profile.setPreferences(Optional.ofNullable(profileDTO.getPreferences()).orElse(Set.of()));
        profile.setAllergies(Optional.ofNullable(profileDTO.getAllergies()).orElse(Set.of()));

        UserProfile savedProfile = userProfileRepository.save(profile);
        return convertProfileToDTO(savedProfile);
    }

    public NutritionProfileDTO getNutritionProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found"));

        NutritionProfileDTO nutrition = new NutritionProfileDTO();
        nutrition.setUserId(userId);

        int targetCalories = Optional.ofNullable(profile.getTargetCalories()).orElse(calculateTdee(user));
        nutrition.setTargetCalories(targetCalories);

        int proteinTarget = Optional.ofNullable(profile.getProteinTarget()).orElse(calculateMacro(targetCalories, 0.25, 4));
        int carbsTarget = Optional.ofNullable(profile.getCarbsTarget()).orElse(calculateMacro(targetCalories, 0.50, 4));
        int fatTarget = Optional.ofNullable(profile.getFatTarget()).orElse(calculateMacro(targetCalories, 0.25, 9));

        nutrition.setProteinTarget(proteinTarget);
        nutrition.setCarbsTarget(carbsTarget);
        nutrition.setFatTarget(fatTarget);
        nutrition.setMealsPerDay(Optional.ofNullable(profile.getMealsPerDay()).orElse(3));
        nutrition.setPreferences(Optional.ofNullable(profile.getPreferences()).orElse(Set.of()));
        nutrition.setAllergies(Optional.ofNullable(profile.getAllergies()).orElse(Set.of()));

        return nutrition;
    }

    public void completeOnboarding(Long userId) {
        NutritionProfileDTO profile = getNutritionProfile(userId);

        MealPlanGenerateRequest request = new MealPlanGenerateRequest();
        request.setUserId(userId);
        request.setStartDate(LocalDate.now());
        request.setMealsPerDay(profile.getMealsPerDay());
        request.setTargetCalories(profile.getTargetCalories());
        request.setProteinTarget(profile.getProteinTarget());
        request.setCarbsTarget(profile.getCarbsTarget());
        request.setFatTarget(profile.getFatTarget());
        request.setPreferences(profile.getPreferences());
        request.setAllergies(profile.getAllergies());

        nutritionServiceClient.generateMealPlan(request);
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

    private int calculateTdee(User user) {
        double bmr = calculateBmr(user);
        return (int) Math.round(bmr * 1.2); // Giả sử hoạt động nhẹ
    }

    private double calculateBmr(User user) {
        if (user.getGender() == null || user.getAge() == null || user.getHeight() == null || user.getWeight() == null) {
            return 1800;
        }
        double weight = user.getWeight();
        double height = user.getHeight();
        int age = user.getAge();
        if ("female".equalsIgnoreCase(user.getGender())) {
            return 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
        }
        return 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age);
    }

    private int calculateMacro(int targetCalories, double ratio, int caloriesPerGram) {
        return (int) Math.round((targetCalories * ratio) / caloriesPerGram);
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
        dto.setTargetCalories(profile.getTargetCalories());
        dto.setProteinTarget(profile.getProteinTarget());
        dto.setCarbsTarget(profile.getCarbsTarget());
        dto.setFatTarget(profile.getFatTarget());
        dto.setMealsPerDay(profile.getMealsPerDay());
        dto.setPreferences(profile.getPreferences());
        dto.setAllergies(profile.getAllergies());
        return dto;
    }
}