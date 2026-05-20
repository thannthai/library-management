package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Boolean existsByPlanCode(String name);
}
