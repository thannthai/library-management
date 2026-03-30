package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.mapper.GenreMapper;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import com.thanh.librarymanagementsystem.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {
    private final GenreMapper mapper;

    @Override
    public GenreDTO createGenre(GenreDTO genreDTO) {
        Genre savedGenre = mapper.toGenre(genreDTO);

        return mapper.toDTO(savedGenre);
    }
}
