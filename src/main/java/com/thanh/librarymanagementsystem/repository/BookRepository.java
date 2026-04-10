package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.payload.request.BookSearchRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);

    Boolean existsByIsbn(String isbn);

    @Query("SELECT DISTINCT b FROM Book b " +
            "JOIN b.genres g " +
            "JOIN b.authors a " +
            "WHERE (:#{#req.searchTerm} IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :#{#req.searchTerm},'%')))" +
            "AND (:#{#req.genreId} IS NULL OR g.id = :#{#req.genreId})" +
            "AND (:#{#req.authorId} IS NULL OR a.id = :#{#req.authorId})" +
            "AND b.availableCopies > 0" +
            "AND b.active = true")
    Page<Book> searchBooksWithFilters(@Param("req") BookSearchRequest request, Pageable pageable);

    long countByActiveTrue();

    @Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b WHERE b.availableCopies > 0 AND b.active = true")
    long countAvailableBooks();
}
