package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.Genre;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenreRepository extends JpaRepository<Genre, Long> {
}
