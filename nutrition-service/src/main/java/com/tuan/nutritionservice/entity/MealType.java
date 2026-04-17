package com.tuan.nutritionservice.entity;

public enum MealType {
    BREAKFAST,
    LUNCH,
    DINNER,
    SNACK,
    CUSTOM;

    public static MealType fromIndex(int index, int mealsPerDay) {
        if (mealsPerDay <= 3) {
            switch (index) {
                case 1: return BREAKFAST;
                case 2: return LUNCH;
                default: return DINNER;
            }
        }
        if (index == 1) return BREAKFAST;
        if (index == mealsPerDay) return DINNER;
        return SNACK;
    }
}
