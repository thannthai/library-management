package com.thanh.librarymanagementsystem;

import com.thanh.librarymanagementsystem.config.GoogleBookApiConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(GoogleBookApiConfig.class)
@EnableScheduling   // Kích hoạt cơ chế @Scheduled để OverdueScheduler chạy hàng đêm
public class LibraryManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryManagementSystemApplication.class, args);
    }

}

