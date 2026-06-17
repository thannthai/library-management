package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.config.GoogleBookApiConfig;
import com.thanh.librarymanagementsystem.enums.CopyStatus;
import com.thanh.librarymanagementsystem.model.Author;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.model.BookCopy;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.model.Publisher;
import com.thanh.librarymanagementsystem.payload.response.GoogleBookApiResponse;
import com.thanh.librarymanagementsystem.repository.AuthorRepository;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.BookCopyRepository;
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
    private final BookCopyRepository bookCopyRepository;

    @Transactional
    public void seedBooksFromGoogleBookApi(String keyword, int totalRequired) {
        int maxResults = 40; // Tối ưu hóa số lượng kết quả trên 1 request

        for (int startIndex = 0; startIndex < totalRequired; startIndex += maxResults) {
            String url = UriComponentsBuilder.fromUriString(googleBookApiConfig.getBaseUrl())
                    .queryParam("q", keyword)
                    .queryParam("startIndex", startIndex)
                    .queryParam("maxResults", maxResults)
                    .queryParam("key", googleBookApiConfig.getApiKey())
                    .build()
                    .toUriString();

            log.info("Fetching data from Google Books with keyword: {} (From {} to {})...", 
                    keyword, startIndex, startIndex + maxResults);

            GoogleBookApiResponse response = restTemplate.getForObject(url, GoogleBookApiResponse.class);

            if (response == null || response.getItems() == null || response.getItems().isEmpty()) {
                log.warn("No more books found for keyword: {} at startIndex: {}", keyword, startIndex);
                break;
            }

            List<GoogleBookApiResponse.Item> filteredItems = response.getItems().stream()
                    .filter(item -> item.getVolumeInfo().getImageLinks() != null)
                    .filter(item -> item.getVolumeInfo().getImageLinks().getThumbnail() != null)
                    .toList();

            for (GoogleBookApiResponse.Item item : filteredItems) {
                GoogleBookApiResponse.VolumeInfo volumeInfo = item.getVolumeInfo();

                if (volumeInfo.getTitle() == null || volumeInfo.getAuthors() == null || volumeInfo.getPublisher() == null) {
                    continue;
                }

                // 1. Trích xuất mã ISBN trước để phục vụ cho việc chống trùng lặp (Deduplication)
                String isbn = "N/A";
                if (volumeInfo.getIndustryIdentifiers() != null) {
                    isbn = volumeInfo.getIndustryIdentifiers().stream()
                            .filter(id -> "ISBN_13".equals(id.getType()))
                            .map(GoogleBookApiResponse.IndustryIdentifier::getIdentifier)
                            .findFirst()
                            .orElseGet(() -> volumeInfo.getIndustryIdentifiers().stream()
                                    .filter(id -> "ISBN_10".equals(id.getType()))
                                    .map(GoogleBookApiResponse.IndustryIdentifier::getIdentifier)
                                    .findFirst()
                                    .orElse("N/A"));
                }
                
                if (isbn.equals("N/A")) {
                    isbn = "SYS-" + java.util.UUID.randomUUID();
                }

                // 2. Kiểm tra trùng lặp dựa trên ISBN thay vì Title thông thường
                // Nếu là mã hệ thống tự sinh (SYS-) thì check theo tiêu đề để tránh trùng lặp dữ liệu lỗi từ Google
                if (isbn.startsWith("SYS-")) {
                    if (bookRepository.existsByTitle(volumeInfo.getTitle())) {
                        continue;
                    }
                } else {
                    if (bookRepository.existsByIsbn(isbn)) {
                        continue;
                    }
                }

                // 3. Xử lý lưu vết tác giả (Authors)
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

                // 4. Xử lý lưu vết nhà xuất bản (Publisher)
                String publisherName = volumeInfo.getPublisher();
                Publisher publisher = publisherRepository.findByName(publisherName)
                        .orElseGet(() -> {
                            Publisher newPublisher = new Publisher();
                            newPublisher.setName(publisherName);
                            return publisherRepository.save(newPublisher);
                        });

                // 5. Xử lý lưu vết thể loại (Genres)
                List<Genre> genres = new ArrayList<>();
                if (volumeInfo.getCategories() != null) {
                    for (String category : volumeInfo.getCategories()) {
                        Genre genre = genreRepository.findByName(category)
                                .orElseGet(() -> {
                                    Genre newGenre = new Genre();
                                    
                                    String code = category.toUpperCase().replace(" ", "_");
                                    if (code.length() > 50) {
                                        code = code.substring(0, 50);
                                    }
                                    newGenre.setCode(code);

                                    String name = category;
                                    if (name.length() > 100) {
                                        name = name.substring(0, 100);
                                    }
                                    newGenre.setName(name);
                                    
                                    newGenre.setDescription("Data from Google Book Api");
                                    newGenre.setDisplayOrder(0);
                                    return genreRepository.save(newGenre);
                                });
                        genres.add(genre);
                    }
                }

                // 6. Khởi tạo đối tượng Book và map dữ liệu chuẩn chỉnh
                Book book = new Book();
                book.setIsbn(isbn);
                book.setTitle(volumeInfo.getTitle());
                book.setAuthors(authors);
                book.setGenres(genres);
                book.setPublisher(publisher);

                // Xử lý chuẩn hóa định dạng ngày xuất bản phức tạp từ Google API
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
                        log.warn("Invalid date format: {}, fallback to current date", rawDate);
                        book.setPublicationDate(LocalDate.now());
                    }
                }

                String description = volumeInfo.getDescription();
                if (description != null && description.length() > 10000) {
                    description = description.substring(0, 9997) + "...";
                }
                book.setDescription(description);

                String language = volumeInfo.getLanguage();
                if (language != null && language.length() > 20) {
                    language = language.substring(0, 20);
                }
                book.setLanguage(language);

                book.setPages(volumeInfo.getPageCount());
                
                // Cấu hình các thông số mặc định cho mô hình thư viện vật lý hiện tại
                book.setTotalCopies(10);
                book.setAvailableCopies(10);
                book.setPrice(BigDecimal.valueOf(0.0));
                book.setLoanFeePerDay(BigDecimal.valueOf(1000.0));

                String coverImageUrl = volumeInfo.getImageLinks().getThumbnail();
                if (coverImageUrl != null && coverImageUrl.length() > 500) {
                    coverImageUrl = coverImageUrl.substring(0, 500);
                }
                book.setCoverImageUrl(coverImageUrl);

                Book savedBook = bookRepository.save(book);
                log.info("Successfully saved book: {}", savedBook.getTitle());

                for (int i = 1; i <= savedBook.getTotalCopies(); i++) {
                    BookCopy copy = BookCopy.builder()
                            .book(savedBook)
                            .barcode("BARCODE-" + savedBook.getIsbn() + "-" + i)
                            .status(CopyStatus.AVAILABLE)
                            .build();
                    bookCopyRepository.save(copy);
                }
                log.info("Successfully generated {} copies for book: {}", savedBook.getTotalCopies(), savedBook.getTitle());
            }

            // 7. Tạo độ trễ 500ms giữa các vòng lặp gọi API 
            // Giúp hệ thống tránh bị Google đánh dấu là spam request (Rate Limit / Throttling)
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                log.error("Thread sleep interrupted", e);
                Thread.currentThread().interrupt();
            }
        }
    }
}
