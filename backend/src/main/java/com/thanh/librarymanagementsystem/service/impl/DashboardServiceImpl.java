package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.exception.UserException;
import com.thanh.librarymanagementsystem.payload.response.DashboardStatsResponse;
import com.thanh.librarymanagementsystem.repository.BookLoanRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.security.UserPrincipal;
import com.thanh.librarymanagementsystem.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final BookLoanRepository bookLoanRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UserException("Unauthorized access");
        }

        Long userId = userPrincipal.getId();
        if (!userRepository.existsById(userId)) {
            throw new UserException("User not found with ID: " + userId);
        }

        // Count current loans (Checked out or Overdue)
        long currentLoansCount = bookLoanRepository.countByUserIdAndStatusIn(
                userId,
                List.of(LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE)
        );

        // Count reservations (Currently not implemented, return 0)
        long reservationsCount = 0L;

        // Count books read in 2026 (status = 'RETURNED' and returned in 2026)
        LocalDateTime startOfYear = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
        LocalDateTime endOfYear = LocalDateTime.of(2026, 12, 31, 23, 59, 59, 999999999);
        long booksReadCount = bookLoanRepository.countBooksReadInYear(
                userId,
                LoanStatus.RETURNED,
                startOfYear,
                endOfYear
        );

        // Day streak (Hardcoded to 7 as required)
        Integer dayStreak = 7;

        // Reading goal (Hardcoded to 30 as required)
        Integer readingGoal = 30;

        return DashboardStatsResponse.builder()
                .currentLoansCount(currentLoansCount)
                .reservationsCount(reservationsCount)
                .booksReadCount(booksReadCount)
                .dayStreak(dayStreak)
                .readingGoal(readingGoal)
                .build();
    }
}
