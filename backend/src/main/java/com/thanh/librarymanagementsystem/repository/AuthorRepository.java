package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.Author;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthorRepository extends JpaRepository<Author, Long> {
    Optional<Author> findByName(String name);
}
