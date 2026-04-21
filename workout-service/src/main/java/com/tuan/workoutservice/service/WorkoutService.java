package com.tuan.workoutservice.service;

import com.tuan.workoutservice.client.UserServiceClient;
import com.tuan.workoutservice.dto.ExerciseLibraryItemDTO;
import com.tuan.workoutservice.dto.ExerciseSetTemplateDTO;
import com.tuan.workoutservice.dto.ExerciseTemplateDTO;
import com.tuan.workoutservice.dto.SeedWorkoutRequest;
import com.tuan.workoutservice.dto.UserProfileSnapshotDTO;
import com.tuan.workoutservice.dto.UserSnapshotDTO;
import com.tuan.workoutservice.dto.WorkoutDayDTO;
import com.tuan.workoutservice.dto.WorkoutPlanDTO;
import com.tuan.workoutservice.dto.WorkoutPlanDetailDTO;
import com.tuan.workoutservice.dto.WorkoutSessionDTO;
import com.tuan.workoutservice.entity.ExerciseLibraryItem;
import com.tuan.workoutservice.entity.ExerciseSetTemplate;
import com.tuan.workoutservice.entity.ExerciseTemplate;
import com.tuan.workoutservice.entity.WorkoutDay;
import com.tuan.workoutservice.entity.WorkoutPlan;
import com.tuan.workoutservice.entity.WorkoutSession;
import com.tuan.workoutservice.repository.ExerciseLibraryRepository;
import com.tuan.workoutservice.repository.WorkoutPlanRepository;
import com.tuan.workoutservice.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final ExerciseLibraryRepository exerciseLibraryRepository;
    private final UserServiceClient userServiceClient;

    // Workout Plan methods
    public List<WorkoutPlanDTO> getUserWorkoutPlans(Long userId) {
        List<WorkoutPlan> plans = workoutPlanRepository.findByUserId(userId);
        if (plans.isEmpty()) {
            WorkoutPlan generated = buildInitialPlanForUser(userId);
            plans = List.of(generated);
        }

        return plans
                .stream()
                .map(this::convertPlanToDTO)
                .collect(Collectors.toList());
    }

    private WorkoutPlan buildInitialPlanForUser(Long userId) {
        SeedWorkoutRequest request = buildSeedRequest(userId);
        WorkoutPlan plan = WorkoutPlanGenerator.generateSamplePlan(request);
        return workoutPlanRepository.save(plan);
    }

    private SeedWorkoutRequest buildSeedRequest(Long userId) {
        SeedWorkoutRequest request = new SeedWorkoutRequest();
        request.setUserId(userId);
        request.setGender("male");
        request.setAge(25);
        request.setHeightCm(170d);
        request.setWeightKg(70d);
        request.setGoal("Duy trì");
        request.setTrainingLevel("Người mới");
        request.setTrainingDaysPerWeek(3);
        request.setPreferences(Collections.emptyList());

        try {
            UserProfileSnapshotDTO profile = userServiceClient.getUserProfile(userId);
            applyProfileSnapshot(request, profile);
        } catch (Exception ignored) {
            // Keep default values when profile is not available.
        }

        try {
            UserSnapshotDTO user = userServiceClient.getUser(userId);
            applyUserSnapshot(request, user);
        } catch (Exception ignored) {
            // Keep profile/default values when user details are not available.
        }

        return request;
    }

    private void applyProfileSnapshot(SeedWorkoutRequest request, UserProfileSnapshotDTO profile) {
        if (profile == null) {
            return;
        }

        if (profile.getAge() != null && profile.getAge() >= 13) {
            request.setAge(profile.getAge());
        }

        if (profile.getHeight() != null && profile.getHeight() > 0) {
            request.setHeightCm(profile.getHeight());
        }

        if (profile.getWeight() != null && profile.getWeight() > 0) {
            request.setWeightKg(profile.getWeight());
        }

        if (hasText(profile.getGender())) {
            request.setGender(profile.getGender().trim());
        }

        String goal = firstNonBlank(profile.getOnboardingGoal());
        if (hasText(goal)) {
            request.setGoal(toWorkoutGoalLabel(goal));
        }

        String level = firstNonBlank(profile.getFitnessLevel(), profile.getActivityLevel());
        if (hasText(level)) {
            request.setTrainingLevel(toTrainingLevelLabel(level));
        }

        if (profile.getWeeklyGoal() != null && profile.getWeeklyGoal() > 0) {
            int weeklyDays = Math.max(1, Math.min(7, profile.getWeeklyGoal()));
            request.setTrainingDaysPerWeek(weeklyDays);
            request.setTrainingLevel(toTrainingLevelLabel(String.valueOf(weeklyDays)));
        }

        Set<String> preferences = profile.getPreferences();
        if (preferences != null && !preferences.isEmpty()) {
            request.setPreferences(preferences.stream().filter(this::hasText).map(String::trim).toList());
        }
    }

    private void applyUserSnapshot(SeedWorkoutRequest request, UserSnapshotDTO user) {
        if (user == null) {
            return;
        }

        if (user.getAge() != null && user.getAge() >= 13) {
            request.setAge(user.getAge());
        }

        if (user.getHeight() != null && user.getHeight() > 0) {
            request.setHeightCm(user.getHeight());
        }

        if (user.getWeight() != null && user.getWeight() > 0) {
            request.setWeightKg(user.getWeight());
        }

        if (hasText(user.getGender())) {
            request.setGender(user.getGender().trim());
        }

        if (hasText(user.getFitnessGoal())) {
            request.setGoal(toWorkoutGoalLabel(user.getFitnessGoal()));
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String toWorkoutGoalLabel(String value) {
        String normalized = hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
        if (normalized.contains("giam") || normalized.contains("lose") || normalized.contains("fat") || normalized.contains("can")) {
            return "Giảm mỡ";
        }
        if (normalized.contains("tang") || normalized.contains("build") || normalized.contains("muscle") || normalized.contains("gain")) {
            return "Tăng cơ";
        }
        return "Duy trì";
    }

    private String toTrainingLevelLabel(String value) {
        String normalized = hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
        if (normalized.contains("new") || normalized.contains("begin") || normalized.contains("sedentary") || normalized.contains("1-2") || normalized.contains("1 2")) {
            return "Người mới";
        }
        if (normalized.contains("3-4") || normalized.contains("3 4") || normalized.contains("intermediate") || normalized.contains("moderate")) {
            return "Tập 3-4 buổi/tuần";
        }
        if (normalized.contains("5+") || normalized.contains("5 +") || normalized.contains("active") || normalized.contains("advanced")) {
            return "Tập 5+ buổi/tuần";
        }
        return "Người mới";
    }

    public WorkoutPlanDTO createWorkoutPlan(WorkoutPlanDTO planDTO) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(planDTO.getUserId());
        plan.setName(planDTO.getName());
        plan.setDescription(planDTO.getDescription());
        plan.setDifficulty(planDTO.getDifficulty());
        plan.setDurationWeeks(planDTO.getDurationWeeks());
        plan.setGoal(planDTO.getGoal());
        plan.setTrainingSplit(planDTO.getTrainingSplit());
        plan.setTotalDaysPerWeek(planDTO.getTotalDaysPerWeek());

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDTO(savedPlan);
    }

    public WorkoutPlanDetailDTO generateSampleWorkoutPlan(SeedWorkoutRequest request) {
        WorkoutPlan plan = WorkoutPlanGenerator.generateSamplePlan(request);
        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDetailDTO(savedPlan);
    }

    public WorkoutPlanDTO updateWorkoutPlan(Long id, WorkoutPlanDTO planDTO) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        plan.setName(planDTO.getName());
        plan.setDescription(planDTO.getDescription());
        plan.setDifficulty(planDTO.getDifficulty());
        plan.setDurationWeeks(planDTO.getDurationWeeks());
        plan.setGoal(planDTO.getGoal());
        plan.setTrainingSplit(planDTO.getTrainingSplit());
        plan.setTotalDaysPerWeek(planDTO.getTotalDaysPerWeek());

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDTO(savedPlan);
    }

    public WorkoutPlanDetailDTO updateWorkoutPlanDetail(Long id, WorkoutPlanDetailDTO detailDTO) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        plan.setName(hasText(detailDTO.getName()) ? detailDTO.getName().trim() : plan.getName());
        plan.setDescription(detailDTO.getDescription());
        plan.setDifficulty(detailDTO.getDifficulty());
        plan.setDurationWeeks(detailDTO.getDurationWeeks());
        plan.setGoal(detailDTO.getGoal());
        plan.setTrainingSplit(detailDTO.getTrainingSplit());
        plan.setTotalDaysPerWeek(detailDTO.getTotalDaysPerWeek());

        plan.getDays().clear();

        List<WorkoutDayDTO> incomingDays = detailDTO.getDays() == null ? Collections.emptyList() : detailDTO.getDays();
        incomingDays.stream()
                .sorted(Comparator.comparing(day -> day.getDayOrder() == null ? Integer.MAX_VALUE : day.getDayOrder()))
                .forEach(dayDTO -> plan.addDay(convertDayFromDTO(dayDTO, plan.getDays().size() + 1)));

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDetailDTO(savedPlan);
    }

    public WorkoutPlanDetailDTO getWorkoutPlanDetail(Long id) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));
        return convertPlanToDetailDTO(plan);
    }

    public List<ExerciseLibraryItemDTO> getExerciseLibrary(String keyword) {
        List<ExerciseLibraryItem> items;
        if (!hasText(keyword)) {
            items = exerciseLibraryRepository.findAllByOrderByDisplayNameAsc();
        } else {
            items = exerciseLibraryRepository.findByDisplayNameContainingIgnoreCaseOrderByDisplayNameAsc(keyword.trim());
        }

        return items.stream().map(this::convertLibraryToDTO).collect(Collectors.toList());
    }

    public ExerciseLibraryItemDTO resolveExerciseLibraryItem(String exerciseName) {
        String normalizedName = ExerciseLibraryItem.normalizeName(exerciseName);
        return exerciseLibraryRepository.findByNormalizedName(normalizedName)
                .map(this::convertLibraryToDTO)
            .orElseGet(() -> findBestMatchingLibraryItem(exerciseName)
                .map(this::convertLibraryToDTO)
                .orElseGet(() -> buildFallbackLibraryItem(exerciseName)));
    }

    public ExerciseLibraryItemDTO createExerciseLibraryItem(ExerciseLibraryItemDTO dto) {
        validateLibraryName(dto.getDisplayName());

        ExerciseLibraryItem item = new ExerciseLibraryItem();
        item.setDisplayName(dto.getDisplayName());
        item.setMuscleGroup(dto.getMuscleGroup());
        item.setGuidance(dto.getGuidance());
        item.setHighlight(dto.getHighlight());
        item.setTechnicalNotes(dto.getTechnicalNotes());
        item.setVideoUrl(dto.getVideoUrl());

        ExerciseLibraryItem saved = exerciseLibraryRepository.save(item);
        return convertLibraryToDTO(saved);
    }

    public ExerciseLibraryItemDTO updateExerciseLibraryItem(Long id, ExerciseLibraryItemDTO dto) {
        ExerciseLibraryItem item = exerciseLibraryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise library item not found"));

        validateLibraryName(dto.getDisplayName());

        item.setDisplayName(dto.getDisplayName());
        item.setMuscleGroup(dto.getMuscleGroup());
        item.setGuidance(dto.getGuidance());
        item.setHighlight(dto.getHighlight());
        item.setTechnicalNotes(dto.getTechnicalNotes());
        item.setVideoUrl(dto.getVideoUrl());

        ExerciseLibraryItem saved = exerciseLibraryRepository.save(item);
        return convertLibraryToDTO(saved);
    }

    public void deleteExerciseLibraryItem(Long id) {
        if (!exerciseLibraryRepository.existsById(id)) {
            throw new RuntimeException("Exercise library item not found");
        }
        exerciseLibraryRepository.deleteById(id);
    }

    // Workout Session methods
    public List<WorkoutSessionDTO> getUserWorkoutSessions(Long userId) {
        return workoutSessionRepository.findByUserId(userId)
                .stream()
                .map(this::convertSessionToDTO)
                .collect(Collectors.toList());
    }

    private Optional<ExerciseLibraryItem> findBestMatchingLibraryItem(String exerciseName) {
        String normalizedQuery = ExerciseLibraryItem.normalizeName(exerciseName);
        if (!hasText(normalizedQuery)) {
            return Optional.empty();
        }

        List<String> lookupCandidates = buildLookupCandidates(exerciseName);
        ExerciseLibraryItem bestMatch = null;
        int bestScore = 0;

        for (ExerciseLibraryItem item : exerciseLibraryRepository.findAll()) {
            int score = scoreLibraryMatch(item, normalizedQuery, lookupCandidates);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        }

        return bestScore > 0 ? Optional.ofNullable(bestMatch) : Optional.empty();
    }

    private List<String> buildLookupCandidates(String exerciseName) {
        if (!hasText(exerciseName)) {
            return Collections.emptyList();
        }

        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        candidates.add(ExerciseLibraryItem.normalizeName(exerciseName));

        String lowerValue = exerciseName.toLowerCase(Locale.ROOT);
        String[] separators = {" hoặc ", " or ", " | ", " / ", ";", ",", "("};

        for (String separator : separators) {
            int index = lowerValue.indexOf(separator);
            if (index > 0) {
                candidates.add(ExerciseLibraryItem.normalizeName(exerciseName.substring(0, index)));
            }
        }

        return new ArrayList<>(candidates);
    }

    private int scoreLibraryMatch(ExerciseLibraryItem item, String normalizedQuery, List<String> lookupCandidates) {
        if (item == null || !hasText(item.getNormalizedName())) {
            return 0;
        }

        String normalizedItem = item.getNormalizedName();
        if (normalizedItem.equals(normalizedQuery)) {
            return 100;
        }

        int score = 0;
        for (String candidate : lookupCandidates) {
            if (!hasText(candidate)) {
                continue;
            }

            if (normalizedItem.equals(candidate)) {
                return 100;
            }

            if (normalizedItem.contains(candidate) || candidate.contains(normalizedItem)) {
                score = Math.max(score, 85);
            }
        }

        if (normalizedItem.contains(normalizedQuery) || normalizedQuery.contains(normalizedItem)) {
            score = Math.max(score, 75);
        }

        return score;
    }

    public WorkoutSessionDTO startWorkoutSession(WorkoutSessionDTO sessionDTO) {
        WorkoutSession session = new WorkoutSession();
        session.setUserId(sessionDTO.getUserId());
        session.setWorkoutPlanId(sessionDTO.getWorkoutPlanId());
        session.setStartTime(LocalDateTime.now());
        session.setNotes(sessionDTO.getNotes());

        WorkoutSession savedSession = workoutSessionRepository.save(session);
        return convertSessionToDTO(savedSession);
    }

    public WorkoutSessionDTO endWorkoutSession(Long sessionId) {
        WorkoutSession session = workoutSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Workout session not found"));

        session.setEndTime(LocalDateTime.now());
        session.setDurationMinutes((int) Duration.between(session.getStartTime(), session.getEndTime()).toMinutes());
        session.setCompleted(true);

        WorkoutSession savedSession = workoutSessionRepository.save(session);
        return convertSessionToDTO(savedSession);
    }

    private WorkoutDay convertDayFromDTO(WorkoutDayDTO dayDTO, int defaultOrder) {
        WorkoutDay day = new WorkoutDay();
        int dayOrder = dayDTO.getDayOrder() == null ? defaultOrder : dayDTO.getDayOrder();
        day.setDayOrder(dayOrder);
        day.setName(hasText(dayDTO.getName()) ? dayDTO.getName().trim() : "Ngày " + dayOrder);
        day.setFocus(dayDTO.getFocus());
        day.setNotes(dayDTO.getNotes());
        day.setRestBetweenDays(dayDTO.getRestBetweenDays());

        List<ExerciseTemplateDTO> exercises = dayDTO.getExercises() == null ? Collections.emptyList() : dayDTO.getExercises();
        int index = 0;
        for (ExerciseTemplateDTO exerciseDTO : exercises) {
            index += 1;
            day.addExercise(convertExerciseFromDTO(exerciseDTO, index));
        }
        return day;
    }

    private ExerciseTemplate convertExerciseFromDTO(ExerciseTemplateDTO exerciseDTO, int defaultOrder) {
        ExerciseTemplate exercise = new ExerciseTemplate();
        exercise.setExerciseOrder(exerciseDTO.getExerciseOrder() == null ? defaultOrder : exerciseDTO.getExerciseOrder());
        exercise.setName(hasText(exerciseDTO.getName()) ? exerciseDTO.getName().trim() : "Bài tập " + defaultOrder);
        exercise.setMuscleGroup(exerciseDTO.getMuscleGroup());
        exercise.setNotes(exerciseDTO.getNotes());

        List<ExerciseSetTemplateDTO> setTemplates = exerciseDTO.getSetTemplates() == null
                ? Collections.emptyList()
                : exerciseDTO.getSetTemplates();

        if (setTemplates.isEmpty()) {
            exercise.addSetTemplate(buildDefaultSetTemplate());
            return exercise;
        }

        int step = 0;
        for (ExerciseSetTemplateDTO setTemplateDTO : setTemplates) {
            step += 1;
            ExerciseSetTemplate setTemplate = new ExerciseSetTemplate();
            setTemplate.setStepOrder(setTemplateDTO.getStepOrder() == null ? step : setTemplateDTO.getStepOrder());
            setTemplate.setSets(setTemplateDTO.getSets() == null || setTemplateDTO.getSets() <= 0 ? 3 : setTemplateDTO.getSets());
            setTemplate.setReps(hasText(setTemplateDTO.getReps()) ? setTemplateDTO.getReps().trim() : "10-12");
            exercise.addSetTemplate(setTemplate);
        }

        return exercise;
    }

    private ExerciseSetTemplate buildDefaultSetTemplate() {
        ExerciseSetTemplate setTemplate = new ExerciseSetTemplate();
        setTemplate.setStepOrder(1);
        setTemplate.setSets(3);
        setTemplate.setReps("10-12");
        return setTemplate;
    }

    private WorkoutPlanDTO convertPlanToDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = new WorkoutPlanDTO();
        dto.setId(plan.getId());
        dto.setUserId(plan.getUserId());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setDifficulty(plan.getDifficulty());
        dto.setDurationWeeks(plan.getDurationWeeks());
        dto.setGoal(plan.getGoal());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setTrainingSplit(plan.getTrainingSplit());
        dto.setTotalDaysPerWeek(plan.getTotalDaysPerWeek());
        return dto;
    }

    private WorkoutPlanDetailDTO convertPlanToDetailDTO(WorkoutPlan plan) {
        WorkoutPlanDetailDTO dto = new WorkoutPlanDetailDTO();
        dto.setId(plan.getId());
        dto.setUserId(plan.getUserId());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setDifficulty(plan.getDifficulty());
        dto.setDurationWeeks(plan.getDurationWeeks());
        dto.setGoal(plan.getGoal());
        dto.setTrainingSplit(plan.getTrainingSplit());
        dto.setTotalDaysPerWeek(plan.getTotalDaysPerWeek());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setDays(plan.getDays().stream().map(this::convertDayToDTO).collect(Collectors.toList()));
        return dto;
    }

    private WorkoutDayDTO convertDayToDTO(WorkoutDay day) {
        WorkoutDayDTO dto = new WorkoutDayDTO();
        dto.setId(day.getId());
        dto.setDayOrder(day.getDayOrder());
        dto.setName(day.getName());
        dto.setFocus(day.getFocus());
        dto.setNotes(day.getNotes());
        dto.setRestBetweenDays(day.getRestBetweenDays());
        dto.setExercises(day.getExercises().stream().map(this::convertExerciseToDTO).collect(Collectors.toList()));
        return dto;
    }

    private ExerciseTemplateDTO convertExerciseToDTO(ExerciseTemplate exercise) {
        ExerciseTemplateDTO dto = new ExerciseTemplateDTO();
        dto.setId(exercise.getId());
        dto.setExerciseOrder(exercise.getExerciseOrder());
        dto.setName(exercise.getName());
        dto.setMuscleGroup(exercise.getMuscleGroup());
        dto.setNotes(exercise.getNotes());
        dto.setSetTemplates(exercise.getSetTemplates().stream().map(this::convertSetTemplateToDTO).collect(Collectors.toList()));
        return dto;
    }

    private ExerciseSetTemplateDTO convertSetTemplateToDTO(ExerciseSetTemplate setTemplate) {
        ExerciseSetTemplateDTO dto = new ExerciseSetTemplateDTO();
        dto.setId(setTemplate.getId());
        dto.setStepOrder(setTemplate.getStepOrder());
        dto.setSets(setTemplate.getSets());
        dto.setReps(setTemplate.getReps());
        return dto;
    }

    private ExerciseLibraryItemDTO convertLibraryToDTO(ExerciseLibraryItem item) {
        ExerciseLibraryItemDTO dto = new ExerciseLibraryItemDTO();
        dto.setId(item.getId());
        dto.setDisplayName(item.getDisplayName());
        dto.setMuscleGroup(item.getMuscleGroup());
        dto.setGuidance(item.getGuidance());
        dto.setHighlight(item.getHighlight());
        dto.setTechnicalNotes(item.getTechnicalNotes());
        dto.setVideoUrl(item.getVideoUrl());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }

    private ExerciseLibraryItemDTO buildFallbackLibraryItem(String exerciseName) {
        ExerciseLibraryItemDTO dto = new ExerciseLibraryItemDTO();
        String safeName = hasText(exerciseName) ? exerciseName.trim() : "Bài tập";
        dto.setDisplayName(safeName);
        dto.setMuscleGroup("Toàn thân");
        dto.setGuidance("Giữ nhịp đều, kiểm soát chuyển động và ưu tiên kỹ thuật đúng trước khi tăng tải.");
        dto.setHighlight("Siết core, giữ trục cơ thể ổn định trong toàn bộ biên độ.");
        dto.setTechnicalNotes("Nếu chưa có video/hướng dẫn chuẩn, hãy tập với mức tạ nhẹ và theo dõi phản hồi cơ thể.");
        dto.setVideoUrl(buildYouTubeSearchUrl(safeName));
        dto.setUpdatedAt(LocalDateTime.now());
        return dto;
    }

    private String buildYouTubeSearchUrl(String exerciseName) {
        String query = hasText(exerciseName) ? exerciseName.trim() : "exercise";
        return "https://www.youtube.com/results?search_query=" + URLEncoder.encode(query + " exercise tutorial", StandardCharsets.UTF_8);
    }

    private void validateLibraryName(String displayName) {
        if (!hasText(displayName)) {
            throw new RuntimeException("Tên bài tập không được để trống");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private WorkoutSessionDTO convertSessionToDTO(WorkoutSession session) {
        WorkoutSessionDTO dto = new WorkoutSessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setWorkoutPlanId(session.getWorkoutPlanId());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setNotes(session.getNotes());
        dto.setCompleted(session.getCompleted());
        return dto;
    }
}