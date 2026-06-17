package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.response.DashboardStatsResponse;
import com.thanh.librarymanagementsystem.security.UserPrincipal;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats(UserPrincipal userPrincipal);
}
