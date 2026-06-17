package com.thanh.librarymanagementsystem.seeder;

import com.thanh.librarymanagementsystem.enums.UserRole;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.service.BookSeederService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.thanh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final BookSeederService bookSeederService;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public void run(String... args) {
        initializeAdminUser();
        initializeSubscriptionPlans();

        if (bookRepository.count() == 0) {
            System.out.println("--- BẮT ĐẦU CÀO SÁCH DIỆN RỘNG TỪ GOOGLE BOOKS ---");

            // Tham số thứ 2 là tổng số sách muốn quét cho chủ đề đó (Ví dụ: 80 cuốn)
            bookSeederService.seedBooksFromGoogleBookApi("subject:computers", 80);
            bookSeederService.seedBooksFromGoogleBookApi("subject:data science", 80);
            bookSeederService.seedBooksFromGoogleBookApi("subject:fiction", 80);
            bookSeederService.seedBooksFromGoogleBookApi("subject:business", 40);
            bookSeederService.seedBooksFromGoogleBookApi("subject:psychology", 40);
            bookSeederService.seedBooksFromGoogleBookApi("subject:history", 40);

            System.out.println("--- ĐÃ NẠP KHO SÁCH THÀNH CÔNG VÀO DATABASE! ---");
        }
    }

    public void initializeAdminUser() {
        // Admin gốc (legacy)
        String legacyEmail = "admin@gmail.com";
        if (!userRepository.existsByEmail(legacyEmail)) {
            User admin = User.builder()
                    .email(legacyEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .roles(Set.of(UserRole.ROLE_ADMIN))
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin user (legacy) created: " + legacyEmail);
        }

        // Admin chính thức BookNest
        String booknestEmail = "admin@booknest.com";
        if (!userRepository.existsByEmail(booknestEmail)) {
            User admin = User.builder()
                    .email(booknestEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .roles(Set.of(UserRole.ROLE_ADMIN))
                    .verified(true)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin user (BookNest) created: " + booknestEmail);
        }
    }

    public void initializeSubscriptionPlans() {
        System.out.println("--- KIỂM TRA VÀ KHỞI TẠO CÁC GÓI THÀNH VIÊN ---");

        // Ghi chú: Gói FREE (Mặc định) không cần lưu DB vì nó là trạng thái ngầm định khi User không có gói VIP nào.
        // FREE: Giá 15k, Tối đa 2 cuốn, Hạn mượn 7 ngày, Không đặt trước.

        // 1. Khởi tạo gói VIP 1 Tuần
        if (!subscriptionPlanRepository.existsByPlanCode("VIP_1W")) {
            SubscriptionPlan vip1w = new SubscriptionPlan();
            vip1w.setPlanCode("VIP_1W");
            vip1w.setPlanName("VIP 1 Tuần");
            vip1w.setDescription("Trải nghiệm đặc quyền VIP ngắn ngày.");
            vip1w.setPrice(BigDecimal.valueOf(49000.00)); // 49,000 VND
            vip1w.setDurationInDays(7); // Hạn dùng 7 ngày
            vip1w.setMaxBooksAllowed(5); // Mượn tối đa 5 cuốn sách đồng thời
            vip1w.setMaxDaysPerBook(30); // Mỗi cuốn mượn tối đa 30 ngày
            vip1w.setIsActive(true);
            vip1w.setIsFeatured(false);
            vip1w.setAutoRenew(false);
            vip1w.setDisplayOrder(1);
            vip1w.setFeatures(List.of(
                "Mượn sách miễn phí 100% (Giá mượn 0đ)",
                "Mượn tối đa 5 cuốn sách đồng thời",
                "Thời gian giữ sách 30 ngày/cuốn",
                "Được quyền đặt chỗ trước (Tối đa 2 cuốn)",
                "Gia hạn sách trực tuyến 1 lần (+5 ngày)"
            ));
            subscriptionPlanRepository.save(vip1w);
            System.out.println("Created VIP 1 Week Plan successfully!");
        }

        // 2. Khởi tạo gói VIP 1 Tháng
        if (!subscriptionPlanRepository.existsByPlanCode("VIP_1M")) {
            SubscriptionPlan vip1m = new SubscriptionPlan();
            vip1m.setPlanCode("VIP_1M");
            vip1m.setPlanName("VIP 1 Tháng");
            vip1m.setDescription("Gói tối ưu cho độc giả thường xuyên. Tiết kiệm hơn.");
            vip1m.setPrice(BigDecimal.valueOf(149000.00)); // 149,000 VND
            vip1m.setDurationInDays(30); // Hạn dùng 30 ngày
            vip1m.setMaxBooksAllowed(5); // Mượn tối đa 5 cuốn sách đồng thời
            vip1m.setMaxDaysPerBook(30); // Mỗi cuốn mượn tối đa 30 ngày
            vip1m.setIsActive(true);
            vip1m.setIsFeatured(true);
            vip1m.setBadgeText("Best Value");
            vip1m.setAutoRenew(false);
            vip1m.setDisplayOrder(2);
            vip1m.setFeatures(List.of(
                "Mượn sách miễn phí 100% (Giá mượn 0đ)",
                "Mượn tối đa 5 cuốn sách đồng thời",
                "Thời gian giữ sách 30 ngày/cuốn",
                "Được quyền đặt chỗ trước (Tối đa 2 cuốn)",
                "Gia hạn sách trực tuyến 1 lần (+5 ngày)",
                "Hỗ trợ giao sách tận nhà ưu tiên"
            ));
            subscriptionPlanRepository.save(vip1m);
            System.out.println("Created VIP 1 Month Plan successfully!");
        }

        System.out.println("--- HOÀN THÀNH LUỒNG KHỞI TẠO GÓI ---");
    }
}
