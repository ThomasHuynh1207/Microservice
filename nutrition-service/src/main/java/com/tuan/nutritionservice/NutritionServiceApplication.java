package com.tuan.nutritionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.tuan.nutritionservice.client")
public class NutritionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NutritionServiceApplication.class, args);
    }
}
