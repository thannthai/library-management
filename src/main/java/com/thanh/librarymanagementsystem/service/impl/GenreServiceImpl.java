package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.GenreException;
import com.thanh.librarymanagementsystem.mapper.GenreMapper;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.response.GenreResponse;
import com.thanh.librarymanagementsystem.payload.request.GenreRequest;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import com.thanh.librarymanagementsystem.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {
    private final GenreRepository repository;
    private final GenreMapper mapper;

    @Override
    public GenreResponse createGenre(GenreRequest genreDTO) {
        Genre genre = mapper.toEntity(genreDTO);
        Genre savedGenre = repository.save(genre);
        return mapper.toDTO(savedGenre);
    }

    @Override
    public List<GenreResponse> getAllGenres() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .toList();
    }

    @Override
    public GenreResponse getGenreByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::toDTO)
                .orElseThrow(() -> new GenreException("Not found!"));
    }

    @Override
    public GenreResponse updateGenre(Long genreId, GenreRequest genre) {
        Genre existingGenre = repository.findById(genreId).orElseThrow(() -> new GenreException("Not found!"));
        mapper.updateEntity(genre, existingGenre);

        repository.save(existingGenre);

        return mapper.toDTO(existingGenre);
    }

    @Override
    public void deleteGenre(Long genreId) {
        Genre existingGenre = repository.findById(genreId).orElseThrow(() -> new GenreException("Not found!"));
        existingGenre.setActive(false);
        repository.save(existingGenre);
    }

    @Override
    public void hardDeleteGenre(Long genreId) {
        Genre existingGenre = repository.findById(genreId).orElseThrow(() -> new GenreException("Not found!"));
        repository.delete(existingGenre);
    }

    @Override
    public List<GenreResponse> getAllActiveGenresWithSubGenres() {
        List<Genre> genres = repository.findByActiveTrueOrderByDisplayOrderAsc();
        return mapper.toDTO(genres);
    }

    @Override
    public List<GenreResponse> getTopLevelGenres() {
        List<Genre> genres = repository.findByParentGenreIsNullAndActiveTrueOrderByDisplayOrderAsc();
        return mapper.toDTO(genres);
    }

    @Override
    public long getTotalActiveGenres() {
        return repository.countByActiveTrue();
    }

    @Override
    public long getBookCountByGenre(Long genreId) {
        return 0;
    }
}
