package com.tuan.activityservice.controller;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.Route;
import com.tuan.activityservice.entity.SportDefinition;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import com.tuan.activityservice.repository.ChallengeParticipantRepository;
import com.tuan.activityservice.repository.ChallengeRepository;
import com.tuan.activityservice.repository.RouteRepository;
import com.tuan.activityservice.repository.SavedRouteRepository;
import com.tuan.activityservice.service.ActivityService;
import com.tuan.activityservice.service.ActivityService.SportDefRequest;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities/admin")
public class ActivityAdminController {

    private final ActivityRepository activityRepo;
    private final RouteRepository routeRepo;
    private final SavedRouteRepository savedRouteRepo;
    private final ChallengeRepository challengeRepo;
    private final ChallengeParticipantRepository participantRepo;
    private final ActivityService activityService;

    public ActivityAdminController(ActivityRepository activityRepo,
                                   RouteRepository routeRepo,
                                   SavedRouteRepository savedRouteRepo,
                                   ChallengeRepository challengeRepo,
                                   ChallengeParticipantRepository participantRepo,
                                   ActivityService activityService) {
        this.activityRepo = activityRepo;
        this.routeRepo = routeRepo;
        this.savedRouteRepo = savedRouteRepo;
        this.challengeRepo = challengeRepo;
        this.participantRepo = participantRepo;
        this.activityService = activityService;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Long>> overview(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(Map.of(
                "totalActivities", activityRepo.count(),
                "runActivities",   activityRepo.countBySportType(SportType.RUN),
                "swimActivities",  activityRepo.countBySportType(SportType.SWIM),
                "totalRoutes",     routeRepo.count(),
                "totalChallenges", challengeRepo.count()
        ));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Activity>> allActivities(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(activityRepo.findAllByOrderByStartedAtDesc());
    }

    @DeleteMapping("/{activityId}")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable Long activityId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (!activityRepo.existsById(activityId))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        activityRepo.deleteById(activityId);
        return ResponseEntity.noContent().build();
    }

    // ── Routes ──────────────────────────────────────────────────────────────

    @GetMapping("/routes")
    public ResponseEntity<Map<String, Object>> listRoutes(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "ALL") String sport,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Specification<Route> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("name")), like));
        }
        if (!"ALL".equals(sport)) {
            SportType st = SportType.valueOf(sport);
            spec = spec.and((root, q, cb) -> cb.equal(root.get("sportType"), st));
        }
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Route> result = routeRepo.findAll(spec, pageable);
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "page", result.getNumber(),
                "size", result.getSize()
        ));
    }

    @GetMapping("/routes/stats")
    public ResponseEntity<Map<String, Long>> routeStats(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(Map.of(
                "total", routeRepo.count(),
                "run",   routeRepo.countBySportType(SportType.RUN),
                "swim",  routeRepo.countBySportType(SportType.SWIM)
        ));
    }

    @PostMapping("/routes")
    public ResponseEntity<Route> createRoute(
            @RequestBody RouteRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Route route = new Route();
        route.setName(req.name());
        route.setSportType(req.sportType());
        route.setPlace(req.place() != null ? req.place() : "");
        route.setDistanceMeters(req.distanceMeters());
        route.setNote(req.note());
        return ResponseEntity.ok(routeRepo.save(route));
    }

    @DeleteMapping("/routes/{routeId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteRoute(
            @PathVariable Long routeId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (!routeRepo.existsById(routeId))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        savedRouteRepo.deleteByRoute_Id(routeId);
        routeRepo.deleteById(routeId);
        return ResponseEntity.noContent().build();
    }

    // ── Challenges ──────────────────────────────────────────────────────────

    @DeleteMapping("/challenges/{challengeId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteChallenge(
            @PathVariable Long challengeId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (!challengeRepo.existsById(challengeId))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        participantRepo.deleteByChallenge_Id(challengeId);
        challengeRepo.deleteById(challengeId);
        return ResponseEntity.noContent().build();
    }

    // ── Sports ──────────────────────────────────────────────────────────────

    @GetMapping("/sports")
    public ResponseEntity<List<SportDefinition>> getAllSports(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(activityService.activeSportDefs());
    }

    @PostMapping("/sports")
    public ResponseEntity<SportDefinition> createSport(
            @RequestBody SportDefRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.ok(activityService.createSportDef(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @PutMapping("/sports/{id}")
    public ResponseEntity<SportDefinition> updateSport(
            @PathVariable Long id,
            @RequestBody SportDefRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.ok(activityService.updateSportDef(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/sports/{id}")
    public ResponseEntity<Void> deleteSport(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            activityService.deleteSportDef(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private boolean isAdmin(String requesterRole) {
        return requesterRole != null && requesterRole.equalsIgnoreCase("ADMIN");
    }

    public record RouteRequest(String name, SportType sportType, String place,
                               int distanceMeters, String note) {}
}
