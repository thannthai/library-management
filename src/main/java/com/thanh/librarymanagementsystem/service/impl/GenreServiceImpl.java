package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.GenreException;
import com.thanh.librarymanagementsystem.mapper.GenreMapper;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
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
    public GenreDTO createGenre(GenreDTO genreDTO) {
        Genre genre = mapper.toEntity(genreDTO);
        Genre savedGenre = repository.save(genre);
        return mapper.toDTO(savedGenre);
    }

    @Override
    public List<GenreDTO> getAllGenres() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .toList();
    }

    @Override
    public GenreDTO getGenreByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::toDTO)
                .orElseThrow(() -> new GenreException("Not found!"));
    }

    @Override
    public GenreDTO updateGenre(Long genreId, GenreDTO genre) {
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
    public List<GenreDTO> getAllActiveGenresWithSubGenres() {
        List<Genre> genres = repository.findByActiveTrueOrderByDisplayOrderAsc();
        return mapper.toDTO(genres);
    }

    @Override
    public List<GenreDTO> getTopLevelGenres() {
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
