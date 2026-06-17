package com.thanh.librarymanagementsystem.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "google.books")
@Getter
@Setter
public class GoogleBookApiConfig {
    private String apiKey;
    private String baseUrl;
}
