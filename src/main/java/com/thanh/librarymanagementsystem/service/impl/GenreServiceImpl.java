package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import com.thanh.librarymanagementsystem.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {
    private final GenreRepository repository;

    @Override
    public GenreDTO createGenre(GenreDTO genreDTO) {

        Genre savedGenre = Genre.builder()
                .code(genreDTO.getCode())
                .name(genreDTO.getName())
                .description(genreDTO.getDescription())
                .displayOrder(genreDTO.getDisplayOrder())
                .active(genreDTO.getActive())
                .build();

        if (genreDTO.getParentGenreId() != null) {
            Genre parentGenre = repository.findById(Long.valueOf(genreDTO.getParentGenreId())).orElseThrow(() -> new RuntimeException("Parent id is not found " + genreDTO.getParentGenreId()));
        }


//        return repository.save(genre);
        return null;
    }
}
