package com.tuan.activityservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sport_definitions")
public class SportDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;          // "RUN", "TRAIL", "SWIM", …

    @Column(nullable = false)
    private String label;         // "Chạy bộ", "Bơi lội", …

    private String icon;          // emoji: "🏃", "🏊", …

    @Column(nullable = false)
    private String category;      // Group label: "Chạy bộ", "Đạp xe", …

    @Column(nullable = false, name = "backend_sport")
    private String backendSport;  // "RUN" or "SWIM"

    @Column(name = "sort_order")
    private int sortOrder;

    private boolean active = true;

    public Long getId() { return id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getBackendSport() { return backendSport; }
    public void setBackendSport(String backendSport) { this.backendSport = backendSport; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
