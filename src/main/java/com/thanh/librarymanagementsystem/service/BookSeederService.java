package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.config.GoogleBookApiConfig;
import com.thanh.librarymanagementsystem.model.Author;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.model.Publisher;
import com.thanh.librarymanagementsystem.payload.response.GoogleBookApiResponse;
import com.thanh.librarymanagementsystem.repository.AuthorRepository;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import com.thanh.librarymanagementsystem.repository.PublisherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookSeederService {
    private final GoogleBookApiConfig googleBookApiConfig;

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final RestTemplate restTemplate;
    private final GenreRepository genreRepository;

    @Transactional
    public void seedBooksFromGoogleBookApi(String keyword) {
        String url = UriComponentsBuilder.fromUriString(googleBookApiConfig.getBaseUrl())
                .queryParam("q", keyword)
                .queryParam("maxResults", 10)
                .queryParam("key", googleBookApiConfig.getApiKey())
                .build()
                .toUriString();

        log.info("Fetching data from Google Books with keyword: {}......", keyword);

        GoogleBookApiResponse response = restTemplate.getForObject(url, GoogleBookApiResponse.class);

        if (response == null || response.getItems() == null) {
            log.warn("No books found for keyword: {}", keyword);
            return;
        }

        List<GoogleBookApiResponse.Item> filteredItems = response.getItems().stream()
                .filter(item -> item.getVolumeInfo().getImageLinks() != null)
                .filter(item -> item.getVolumeInfo().getImageLinks().getThumbnail() != null)
                .toList();

        for (GoogleBookApiResponse.Item item : filteredItems) {
            GoogleBookApiResponse.VolumeInfo volumeInfo = item.getVolumeInfo();

            if (volumeInfo.getTitle() == null || volumeInfo.getAuthors() == null || volumeInfo.getPublisher() == null) {
                log.warn("Missing value");
                continue;
            }

            List<Author> authors = new ArrayList<>();
            for (String authorName : volumeInfo.getAuthors()) {
                Author author = authorRepository.findByName(authorName)
                        .orElseGet(() -> {
                            Author newAuth = new Author();
                            newAuth.setName(authorName);
                            return authorRepository.save(newAuth);
                        });

                authors.add(author);
            }

            String isbn = "N/A";
            if (volumeInfo.getIndustryIdentifiers() != null) {
                isbn = volumeInfo.getIndustryIdentifiers().stream()
                        .filter(industryIdentifier -> "ISBN_13".equals(industryIdentifier.getType()))
                        .map(GoogleBookApiResponse.IndustryIdentifier::getIdentifier)
                        .findFirst()
                        .orElseGet(() -> volumeInfo.getIndustryIdentifiers().stream()
                                .filter(industryIdentifier -> "ISBN_10".equals(industryIdentifier.getType()))
                                .map(GoogleBookApiResponse.IndustryIdentifier::getIdentifier)
                                .findFirst()
                                .orElse("N/A"));
            }
            if (isbn.equals("N/A")) {
                isbn = "SYS-" + java.util.UUID.randomUUID();
            }

            Publisher publisher;
            String publisherName = volumeInfo.getPublisher();
            publisher = publisherRepository.findByName(publisherName)
                    .orElseGet(() -> {
                        Publisher newPublisher = new Publisher();
                        newPublisher.setName(publisherName);
                        return publisherRepository.save(newPublisher);
                    });


            List<Genre> genres = new ArrayList<>();
            if (volumeInfo.getCategories() != null) {
                for (String category : volumeInfo.getCategories()) {
                    Genre genre = genreRepository.findByName(category)
                            .orElseGet(() -> {
                                Genre newGenre = new Genre();

                                newGenre.setCode(category.toUpperCase().replace(" ", "_"));
                                newGenre.setName(category);
                                newGenre.setDescription("Data from Google Book Api");
                                newGenre.setDisplayOrder(0);

                                return genreRepository.save(newGenre);
                            });
                    genres.add(genre);
                }
            }

            Book book = new Book();
            book.setIsbn(isbn);
            book.setTitle(volumeInfo.getTitle());
            book.setAuthors(authors);
            book.setGenres(genres);
            book.setPublisher(publisher);

            String rawDate = volumeInfo.getPublishedDate();
            if (rawDate != null && !rawDate.isEmpty()) {
                try {
                    String[] parts = rawDate.split("-");

                    if (parts.length == 1) {
                        book.setPublicationDate(LocalDate.parse(rawDate + "-01-01"));
                    } else if (parts.length == 2) {
                        book.setPublicationDate(LocalDate.parse(rawDate + "-01"));
                    } else {
                        book.setPublicationDate(LocalDate.parse(rawDate));
                    }
                } catch (DateTimeParseException e) {
                    log.warn("Invalid data date: {}", rawDate);
                    continue;
                }
            }

            book.setDescription(volumeInfo.getDescription());
            book.setLanguage(volumeInfo.getLanguage());
            book.setPages(volumeInfo.getPageCount());
            book.setTotalCopies(10);
            book.setAvailableCopies(10);
            book.setPrice(BigDecimal.valueOf(0.0));
            book.setCoverImageUrl(volumeInfo.getImageLinks().getThumbnail());

            bookRepository.save(book);
            log.info("Successfully saved book: {}", book.getTitle());
        }
    }
}
