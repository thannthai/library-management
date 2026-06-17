package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.DashboardStatsResponse;
import com.thanh.librarymanagementsystem.security.UserPrincipal;
import com.thanh.librarymanagementsystem.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        DashboardStatsResponse stats = dashboardService.getDashboardStats(userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(
                "Dashboard statistics retrieved successfully",
                true,
                stats
        ));
    }
}
