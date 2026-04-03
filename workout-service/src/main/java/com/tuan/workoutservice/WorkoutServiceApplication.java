package com.tuan.workoutservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class WorkoutServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkoutServiceApplication.class, args);
    }
}