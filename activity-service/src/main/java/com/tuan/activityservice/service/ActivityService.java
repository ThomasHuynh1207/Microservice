package com.tuan.activityservice.service;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.ChallengeDefinition;
import com.tuan.activityservice.entity.ChallengeParticipant;
import com.tuan.activityservice.entity.GpsPoint;
import com.tuan.activityservice.entity.Route;
import com.tuan.activityservice.entity.SavedRoute;
import com.tuan.activityservice.entity.SportDefinition;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import com.tuan.activityservice.repository.ChallengeParticipantRepository;
import com.tuan.activityservice.repository.ChallengeRepository;
import com.tuan.activityservice.repository.GpsPointRepository;
import com.tuan.activityservice.repository.RouteRepository;
import com.tuan.activityservice.repository.SavedRouteRepository;
import com.tuan.activityservice.repository.SportDefinitionRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {
    private final ActivityRepository activities;
    private final RouteRepository routes;
    private final SavedRouteRepository savedRoutes;
    private final ChallengeRepository challenges;
    private final ChallengeParticipantRepository participants;
    private final NotificationService notifications;
    private final SportDefinitionRepository sportDefs;
    private final GpsPointRepository gpsPoints;

    public ActivityService(
            ActivityRepository activities,
            RouteRepository routes,
            SavedRouteRepository savedRoutes,
            ChallengeRepository challenges,
            ChallengeParticipantRepository participants,
            NotificationService notifications,
            SportDefinitionRepository sportDefs,
            GpsPointRepository gpsPoints) {
        this.activities = activities;
        this.routes = routes;
        this.savedRoutes = savedRoutes;
        this.challenges = challenges;
        this.participants = participants;
        this.notifications = notifications;
        this.sportDefs = sportDefs;
        this.gpsPoints = gpsPoints;
    }

    // ── Sport definitions ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SportDefinition> activeSportDefs() {
        return sportDefs.findByActiveTrueOrderBySortOrderAsc();
    }

    @Transactional
    public SportDefinition createSportDef(SportDefRequest req) {
        if (sportDefs.existsByCode(req.code().trim().toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Code already exists");
        }
        SportDefinition def = new SportDefinition();
        def.setCode(req.code().trim().toUpperCase(Locale.ROOT));
        def.setLabel(req.label());
        def.setIcon(req.icon() != null ? req.icon() : "⚡");
        def.setCategory(req.category() != null ? req.category() : "Khác");
        def.setBackendSport("SWIM".equalsIgnoreCase(req.backendSport()) ? "SWIM" : "RUN");
        def.setSortOrder(req.sortOrder());
        def.setActive(true);
        return sportDefs.save(def);
    }

    @Transactional
    public SportDefinition updateSportDef(Long id, SportDefRequest req) {
        SportDefinition def = sportDefs.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));
        if (req.label() != null) def.setLabel(req.label());
        if (req.icon() != null) def.setIcon(req.icon());
        if (req.category() != null) def.setCategory(req.category());
        if (req.backendSport() != null) def.setBackendSport("SWIM".equalsIgnoreCase(req.backendSport()) ? "SWIM" : "RUN");
        if (req.sortOrder() > 0) def.setSortOrder(req.sortOrder());
        if (req.active() != null) def.setActive(req.active());
        return sportDefs.save(def);
    }

    @Transactional
    public void deleteSportDef(Long id) {
        if (!sportDefs.existsById(id)) throw new IllegalArgumentException("Sport not found");
        sportDefs.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Activity> userActivities(Long userId) {
        return activities.findByUserIdOrderByStartedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Activity getById(Long id) {
        return activities.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found"));
    }

    @Transactional
    public Activity update(Long id, Long userId, ActivityRequest request) {
        Activity activity = activities.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found"));
        if (!activity.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized");
        }
        if (request.title() != null && !request.title().isBlank()) activity.setTitle(request.title().trim());
        if (request.description() != null) activity.setDescription(request.description());
        if (request.durationMinutes() > 0) activity.setDurationMinutes(request.durationMinutes());
        if (request.distanceMeters() > 0) activity.setDistanceMeters(request.distanceMeters());
        if (request.averageHeartRate() != null) activity.setAverageHeartRate(request.averageHeartRate());
        if (request.calories() != null) activity.setCalories(request.calories());
        if (request.elevationGainMeters() != null) activity.setElevationGainMeters(request.elevationGainMeters());
        if (request.poolLengthMeters() != null) activity.setPoolLengthMeters(request.poolLengthMeters());
        if (request.strokes() != null) activity.setStrokes(request.strokes());
        if (request.routeName() != null) activity.setRouteName(request.routeName());
        if (request.visibility() != null) activity.setVisibility(request.visibility());
        if (request.gpsRouteJson() != null) activity.setGpsRouteJson(request.gpsRouteJson());
        if (request.averagePaceSecondsPerKm() != null) activity.setAveragePaceSecondsPerKm(request.averagePaceSecondsPerKm());
        return activities.save(activity);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Activity activity = activities.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found"));
        if (!activity.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized");
        }
        activities.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> challengeLeaderboard(String challengeId) {
        List<ChallengeParticipant> joined = participants.findByChallenge_Code(challengeId);
        ChallengeDefinition challenge = challenges.findByCode(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));
        String sportType = normalize(challenge.getSportType());
        return joined.stream().map(participant -> {
            Long uid = participant.getUserId();
            List<Activity> week = activities.findByUserIdAndStartedAtAfter(uid, LocalDateTime.now().minusDays(7));
            double value;
            if ("RUN".equals(sportType)) {
                value = metersFor(week, SportType.RUN);
            } else if ("SWIM".equals(sportType)) {
                value = metersFor(week, SportType.SWIM);
            } else {
                value = week.size();
            }
            return new LeaderboardEntry(uid, "Athlete #" + uid, value);
        }).sorted((a, b) -> Double.compare(b.value(), a.value())).toList();
    }

    @Transactional
    public Activity create(ActivityRequest request) {
        Activity activity = new Activity();
        activity.setUserId(request.userId());
        activity.setAthleteName(defaultText(request.athleteName(), "Athlete #" + request.userId()));
        activity.setSportType(request.sportType());
        activity.setTitle(defaultText(request.title(), request.sportType() == SportType.RUN ? "Morning run" : "Pool swim"));
        activity.setDescription(request.description());
        activity.setStartedAt(request.startedAt() == null ? LocalDateTime.now() : request.startedAt());
        activity.setDurationMinutes(request.durationMinutes());
        activity.setDistanceMeters(request.distanceMeters());
        activity.setAverageHeartRate(request.averageHeartRate());
        activity.setCalories(request.calories());
        activity.setElevationGainMeters(request.elevationGainMeters());
        activity.setPoolLengthMeters(request.poolLengthMeters());
        activity.setStrokes(request.strokes());
        activity.setRouteName(request.routeName());
        activity.setVisibility(defaultText(request.visibility(), "PUBLIC"));
        activity.setGpsRouteJson(request.gpsRouteJson());
        activity.setAveragePaceSecondsPerKm(request.averagePaceSecondsPerKm());
        Activity saved = activities.save(activity);

        if (request.gpsRouteJson() != null && !request.gpsRouteJson().isBlank()) {
            String lineString = convertLegacyGpsJson(request.gpsRouteJson());
            if (lineString != null) {
                saved.setGpsRouteJson(lineString);
                activities.save(saved);
                Route route = new Route();
                route.setName(defaultText(request.routeName(), saved.getTitle()));
                route.setSportType(saved.getSportType());
                route.setPlace("");
                route.setDistanceMeters((int) Math.round(saved.getDistanceMeters()));
                route.setNote(request.description() != null ? request.description() : "");
                route.setGeoJson(lineString);
                route.setCreatedBy(saved.getUserId());
                route.setActivityId(saved.getId());
                route.setVisibility(defaultText(request.visibility(), "PUBLIC"));
                routes.save(route);
            }
        }

        notifications.create(
            request.userId(),
            "Activity logged",
            "Your " + saved.getSportType().name().toLowerCase(Locale.ROOT) + " activity is saved.",
            "ACTIVITY"
        );
        return saved;
    }

    @Transactional(readOnly = true)
    public ActivityStats stats(Long userId) {
        List<Activity> week = activities.findByUserIdAndStartedAtAfter(userId, LocalDateTime.now().minusDays(7));
        List<Activity> month = activities.findByUserIdAndStartedAtAfter(userId, LocalDateTime.now().minusDays(30));
        return new ActivityStats(
                metersFor(week, SportType.RUN) / 1000,
                (int) metersFor(week, SportType.SWIM),
                minutesFor(week),
                week.size(),
                metersFor(month, SportType.RUN) / 1000,
                (int) metersFor(month, SportType.SWIM)
        );
    }

    @Transactional(readOnly = true)
    public List<Route> routes() {
        return routes.findPublicRoutes();
    }

    @Transactional(readOnly = true)
    public Route getRoute(Long id) {
        return routes.findById(id).orElseThrow(() -> new IllegalArgumentException("Route not found"));
    }

    @Transactional
    public Activity startActivity(StartActivityRequest req) {
        Activity activity = new Activity();
        activity.setUserId(req.userId());
        activity.setAthleteName(defaultText(req.athleteName(), "Athlete #" + req.userId()));
        activity.setSportType(req.sportType());
        activity.setTitle(defaultText(req.title(), req.sportType() == SportType.RUN ? "GPS Run" : "GPS Swim"));
        activity.setStartedAt(LocalDateTime.now());
        activity.setDurationMinutes(0);
        activity.setDistanceMeters(0);
        activity.setVisibility(defaultText(req.visibility(), "PUBLIC"));
        activity.setStatus("RECORDING");
        return activities.save(activity);
    }

    @Transactional
    public void addGpsPoints(Long activityId, List<GpsPointRequest> pts) {
        activities.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found"));
        List<GpsPoint> entities = new ArrayList<>();
        for (int i = 0; i < pts.size(); i++) {
            GpsPointRequest p = pts.get(i);
            GpsPoint gp = new GpsPoint();
            gp.setActivityId(activityId);
            gp.setLatitude(p.latitude());
            gp.setLongitude(p.longitude());
            gp.setRecordedAt(p.recordedAt() != null ? p.recordedAt() : Instant.now());
            gp.setSequenceOrder(i);
            entities.add(gp);
        }
        gpsPoints.saveAll(entities);
    }

    @Transactional
    public ActivityFinishResult finishActivity(Long activityId, FinishActivityRequest req) {
        Activity activity = activities.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found"));

        List<GpsPoint> pts = gpsPoints.findByActivityIdOrderBySequenceOrderAsc(activityId);
        double distanceMeters = req.distanceMeters() > 0 ? req.distanceMeters() : totalDistanceMeters(pts);
        int durationMins = req.durationMinutes() > 0 ? req.durationMinutes() : 1;

        activity.setStatus("COMPLETED");
        activity.setTitle(defaultText(req.title(), activity.getTitle()));
        activity.setDescription(req.description());
        activity.setDurationMinutes(durationMins);
        activity.setDistanceMeters(distanceMeters);
        activity.setAverageHeartRate(req.averageHeartRate());
        activity.setCalories(req.calories());
        activity.setVisibility(defaultText(req.visibility(), "PUBLIC"));
        if (req.averagePaceSecondsPerKm() != null) activity.setAveragePaceSecondsPerKm(req.averagePaceSecondsPerKm());

        String lineString = buildLineString(pts);
        activity.setGpsRouteJson(lineString != null ? lineString : activity.getGpsRouteJson());
        Activity saved = activities.save(activity);

        Route route = null;
        if (lineString != null && pts.size() >= 2) {
            route = new Route();
            route.setName(defaultText(req.routeName(), saved.getTitle()));
            route.setSportType(saved.getSportType());
            route.setPlace("");
            route.setDistanceMeters((int) Math.round(distanceMeters));
            route.setNote(req.description() != null ? req.description() : "");
            route.setGeoJson(lineString);
            route.setCreatedBy(saved.getUserId());
            route.setActivityId(activityId);
            route.setVisibility(defaultText(req.visibility(), "PUBLIC"));
            route = routes.save(route);
        }

        notifications.create(
            saved.getUserId(), "Activity completed",
            "Your " + saved.getSportType().name().toLowerCase(Locale.ROOT) + " is saved.",
            "ACTIVITY"
        );
        return new ActivityFinishResult(saved, route);
    }

    @Transactional
    public Route createUserRoute(Long userId, RouteCreateRequest req) {
        Route route = new Route();
        route.setName(req.name().trim());
        route.setSportType(req.sportType());
        route.setPlace(req.place() != null ? req.place().trim() : "");
        route.setDistanceMeters(req.distanceMeters());
        route.setNote(req.note() != null ? req.note() : "");
        route.setGeoJson(req.geoJson());
        route.setCreatedBy(userId);
        route.setVisibility("PUBLIC");
        return routes.save(route);
    }

    @Transactional
    public Route toggleRouteVisibility(Long userId, Long routeId) {
        Route route = routes.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));
        if (!userId.equals(route.getCreatedBy())) {
            throw new SecurityException("Not authorized");
        }
        route.setVisibility("PUBLIC".equals(route.getVisibility()) ? "PRIVATE" : "PUBLIC");
        return routes.save(route);
    }

    @Transactional
    public void deleteUserRoute(Long userId, Long routeId) {
        Route route = routes.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));
        if (!userId.equals(route.getCreatedBy())) {
            throw new SecurityException("Not authorized to delete this route");
        }
        savedRoutes.deleteByRoute_Id(routeId);
        routes.deleteById(routeId);
    }

    @Transactional(readOnly = true)
    public List<Long> savedRoutes(Long userId) {
        return savedRoutes.findByUserId(userId).stream()
                .map(saved -> saved.getRoute().getId())
                .toList();
    }

    @Transactional
    public void saveRoute(Long userId, Long routeId) {
        if (savedRoutes.existsByUserIdAndRoute_Id(userId, routeId)) {
            return;
        }
        Route route = routes.findById(routeId).orElseThrow(() -> new IllegalArgumentException("Route not found"));
        SavedRoute saved = new SavedRoute();
        saved.setUserId(userId);
        saved.setRoute(route);
        savedRoutes.save(saved);
    }

    @Transactional
    public void removeRoute(Long userId, Long routeId) {
        savedRoutes.deleteByUserIdAndRoute_Id(userId, routeId);
    }

    @Transactional(readOnly = true)
    public List<ChallengeView> challenges(Long userId) {
        List<Activity> week = activities.findByUserIdAndStartedAtAfter(userId, LocalDateTime.now().minusDays(7));
        double runMeters = metersFor(week, SportType.RUN);
        double swimMeters = metersFor(week, SportType.SWIM);
        long runSessions = week.stream().filter(activity -> activity.getSportType() == SportType.RUN).count();
        long swimSessions = week.stream().filter(activity -> activity.getSportType() == SportType.SWIM).count();
        Set<String> joined = participants.findByUserId(userId).stream()
                .map(participant -> participant.getChallenge().getCode())
                .collect(Collectors.toSet());

        return challenges.findAll().stream()
                .map(challenge -> toView(challenge, joined.contains(challenge.getCode()), runMeters, swimMeters, runSessions, swimSessions))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeDefinition> challengeDefinitions() {
        return challenges.findAll();
    }

    @Transactional
    public ChallengeDefinition createChallenge(ChallengeRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            throw new IllegalArgumentException("Challenge code is required");
        }
        if (challenges.findByCode(request.code()).isPresent()) {
            throw new IllegalArgumentException("Challenge code already exists");
        }
        ChallengeDefinition challenge = new ChallengeDefinition();
        challenge.setCode(request.code().trim());
        challenge.setTitle(defaultText(request.title(), request.code()));
        challenge.setSportType(defaultText(request.sportType(), "MIXED").toUpperCase(Locale.ROOT));
        challenge.setTargetValue(request.targetValue());
        challenge.setUnit(defaultText(request.unit(), "activities").toLowerCase(Locale.ROOT));
        challenge.setNote(defaultText(request.note(), ""));
        return challenges.save(challenge);
    }

    @Transactional
    public void joinChallenge(Long userId, String challengeId) {
        if (participants.existsByUserIdAndChallenge_Code(userId, challengeId)) {
            return;
        }
        ChallengeDefinition challenge = challenges.findByCode(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));
        ChallengeParticipant participant = new ChallengeParticipant();
        participant.setUserId(userId);
        participant.setChallenge(challenge);
        participants.save(participant);
        notifications.create(userId, "Challenge joined", "You joined " + challenge.getTitle() + ".", "CHALLENGE");
    }

    @Transactional
    public void leaveChallenge(Long userId, String challengeId) {
        participants.deleteByUserIdAndChallenge_Code(userId, challengeId);
    }

    private ChallengeView toView(
            ChallengeDefinition challenge,
            boolean joined,
            double runMeters,
            double swimMeters,
            long runSessions,
            long swimSessions) {
        double progress;
        String sportType = normalize(challenge.getSportType());
        if ("RUN".equals(sportType)) {
            progress = percentage(runMeters, challenge.getTargetValue());
        } else if ("SWIM".equals(sportType)) {
            progress = percentage(swimMeters, challenge.getTargetValue());
        } else {
            int mixedProgress = Math.min((int) runSessions, 2) + Math.min((int) swimSessions, 2);
            progress = percentage(mixedProgress, challenge.getTargetValue());
        }
        return new ChallengeView(
                challenge.getCode(),
                challenge.getTitle(),
                challenge.getSportType(),
                targetLabel(challenge),
                Math.min(100, progress),
                challenge.getNote(),
                joined
        );
    }

    private double metersFor(List<Activity> source, SportType sportType) {
        return source.stream()
                .filter(activity -> activity.getSportType() == sportType)
                .mapToDouble(Activity::getDistanceMeters)
                .sum();
    }

    private int minutesFor(List<Activity> source) {
        return source.stream().mapToInt(Activity::getDurationMinutes).sum();
    }

    private double percentage(double current, double target) {
        if (target <= 0) {
            return 0;
        }
        return (current / target) * 100;
    }

    private String targetLabel(ChallengeDefinition challenge) {
        String unit = normalize(challenge.getUnit());
        int target = challenge.getTargetValue();
        if ("METERS".equals(unit)) {
            if ("RUN".equals(normalize(challenge.getSportType())) && target >= 1000) {
                double km = target / 1000.0;
                return km % 1 == 0 ? String.format(Locale.US, "%.0f km", km) : String.format(Locale.US, "%.1f km", km);
            }
            return target + " m";
        }
        if ("ACTIVITIES".equals(unit)) {
            return target + " sessions";
        }
        return target + " " + challenge.getUnit();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static double totalDistanceMeters(List<GpsPoint> pts) {
        double total = 0;
        for (int i = 1; i < pts.size(); i++) {
            total += haversineMeters(
                    pts.get(i - 1).getLatitude(), pts.get(i - 1).getLongitude(),
                    pts.get(i).getLatitude(), pts.get(i).getLongitude());
        }
        return total;
    }

    private static String buildLineString(List<GpsPoint> pts) {
        if (pts.size() < 2) return null;
        StringBuilder sb = new StringBuilder("{\"type\":\"LineString\",\"coordinates\":[");
        for (int i = 0; i < pts.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("[").append(pts.get(i).getLongitude()).append(",").append(pts.get(i).getLatitude()).append("]");
        }
        sb.append("]}");
        return sb.toString();
    }

    /** Convert legacy [{lat,lng,ts}] array to GeoJSON LineString, or return as-is if already GeoJSON. */
    @SuppressWarnings("unchecked")
    private static String convertLegacyGpsJson(String json) {
        if (json == null || json.isBlank()) return null;
        String trimmed = json.trim();
        if (trimmed.startsWith("{")) return trimmed; // already GeoJSON
        if (!trimmed.startsWith("[")) return null;
        // Parse simple [{lat:...,lng:...},...] without a heavy JSON library
        try {
            List<double[]> coords = new ArrayList<>();
            String inner = trimmed.substring(1, trimmed.length() - 1).trim();
            if (inner.isEmpty()) return null;
            for (String obj : splitJsonObjects(inner)) {
                Double lat = extractDouble(obj, "lat");
                Double lng = extractDouble(obj, "lng");
                if (lat != null && lng != null) coords.add(new double[]{lng, lat});
            }
            if (coords.size() < 2) return null;
            StringBuilder sb = new StringBuilder("{\"type\":\"LineString\",\"coordinates\":[");
            for (int i = 0; i < coords.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("[").append(coords.get(i)[0]).append(",").append(coords.get(i)[1]).append("]");
            }
            sb.append("]}");
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private static List<String> splitJsonObjects(String s) {
        List<String> result = new ArrayList<>();
        int depth = 0, start = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '{') { if (depth == 0) start = i; depth++; }
            else if (c == '}') { depth--; if (depth == 0) result.add(s.substring(start, i + 1)); }
        }
        return result;
    }

    private static Double extractDouble(String obj, String key) {
        String search = "\"" + key + "\"";
        int idx = obj.indexOf(search);
        if (idx < 0) return null;
        int colon = obj.indexOf(':', idx + search.length());
        if (colon < 0) return null;
        int end = colon + 1;
        while (end < obj.length() && (Character.isDigit(obj.charAt(end)) || obj.charAt(end) == '.' || obj.charAt(end) == '-')) end++;
        String num = obj.substring(colon + 1, end).trim();
        return num.isEmpty() ? null : Double.parseDouble(num);
    }

    public record ActivityRequest(
            Long userId,
            String athleteName,
            SportType sportType,
            String title,
            String description,
            LocalDateTime startedAt,
            int durationMinutes,
            double distanceMeters,
            Integer averageHeartRate,
            Integer calories,
            Double elevationGainMeters,
            Integer poolLengthMeters,
            Integer strokes,
            String routeName,
            String visibility,
            String gpsRouteJson,
            Integer averagePaceSecondsPerKm
    ) {
    }

    public record ActivityStats(
            double weeklyRunKm,
            int weeklySwimMeters,
            int weeklyMinutes,
            int weeklySessions,
            double monthlyRunKm,
            int monthlySwimMeters
    ) {
    }

        public record ChallengeView(
            String id,
            String title,
            String sportType,
            String target,
            double progress,
            String note,
            boolean joined
        ) {
        }

        public record ChallengeRequest(String code, String title, String sportType, int targetValue, String unit, String note) {
        }

        public record LeaderboardEntry(Long userId, String athleteName, double value) {
        }

        public record RouteCreateRequest(String name, SportType sportType, String place, int distanceMeters, String note, String geoJson) {
        }

        public record SportDefRequest(String code, String label, String icon, String category,
                                      String backendSport, int sortOrder, Boolean active) {
        }

        public record StartActivityRequest(
                Long userId,
                String athleteName,
                SportType sportType,
                String title,
                String visibility
        ) {
        }

        public record GpsPointRequest(
                double latitude,
                double longitude,
                Instant recordedAt
        ) {
        }

        public record FinishActivityRequest(
                String title,
                String description,
                int durationMinutes,
                double distanceMeters,
                Integer averageHeartRate,
                Integer calories,
                String visibility,
                String routeName,
                Integer averagePaceSecondsPerKm
        ) {
        }

        public record ActivityFinishResult(Activity activity, Route route) {
        }
}
