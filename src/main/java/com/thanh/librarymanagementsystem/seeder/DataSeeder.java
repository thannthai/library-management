package com.thanh.librarymanagementsystem.seeder;

import com.thanh.librarymanagementsystem.domain.UserRole;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.service.BookSeederService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final BookSeederService bookSeederService;
    private final BookRepository bookRepository;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeAdminUser();

        if (bookRepository.count() == 0) {
            System.out.println("Starting fetching books from Google...");

            bookSeederService.seedBooksFromGoogleBookApi("subject:java programming");
            bookSeederService.seedBooksFromGoogleBookApi("subject:data science");
            bookSeederService.seedBooksFromGoogleBookApi("subject:fiction");

            System.out.println("Fetched data successfully!");
        }
    }

    public void initializeAdminUser() {
        String email = "admin@gmail.com";

        if (!userRepository.existsByEmail(email)) {
            String password = "admin123";

            User admin = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .roles(Set.of(UserRole.ROLE_ADMIN))
                    .build();

            userRepository.save(admin);

            System.out.println("Admin user created successfully!");
        }
    }
}
