package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
//
public interface GenreService {
    GenreDTO createGenre(GenreDTO genreDTO);

    List<GenreDTO> getAllGenres();

    GenreDTO getGenreByCode(String code);

    GenreDTO updateGenre(Long genreId, GenreDTO genre);

    void deleteGenre(Long genreId);

    void hardDeleteGenre(Long genreId);

    List<GenreDTO> getAllActiveGenresWithSubGenres();

    List<GenreDTO> getTopLevelGenres();

    //Page<GenreDTO> searchGenres(String searchTerm, Pageable pageable);

    long getTotalActiveGenres();

    long getBookCountByGenre(Long genreId);
}
