package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.response.GenreResponse;
import com.thanh.librarymanagementsystem.payload.request.GenreRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
//
public interface GenreService {
    GenreResponse createGenre(GenreRequest genreDTO);

    List<GenreResponse> getAllGenres();

    GenreResponse getGenreByCode(String code);

    GenreResponse updateGenre(Long genreId, GenreRequest genre);

    void deleteGenre(Long genreId);

    void hardDeleteGenre(Long genreId);

    List<GenreResponse> getAllActiveGenresWithSubGenres();

    List<GenreResponse> getTopLevelGenres();

    //Page<GenreDTO> searchGenres(String searchTerm, Pageable pageable);

    long getTotalActiveGenres();

    long getBookCountByGenre(Long genreId);
}
