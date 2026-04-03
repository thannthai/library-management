package com.thanh.librarymanagementsystem.seeder;

import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.service.BookSeederService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final BookSeederService bookSeederService;
    private final BookRepository bookRepository;

    @Override
    public void run(String... args) {
        if (bookRepository.count() == 0) {
            System.out.println("Starting fetching books from Google...");

            bookSeederService.seedBooksFromGoogleBookApi("subject:java programming");
            bookSeederService.seedBooksFromGoogleBookApi("subject:data science");
            bookSeederService.seedBooksFromGoogleBookApi("subject:fiction");

            System.out.println("Fetched data successfully!");
        }
    }
}
