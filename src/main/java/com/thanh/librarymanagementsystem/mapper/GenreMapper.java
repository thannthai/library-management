package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.exception.GenreException;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreResponse;
import com.thanh.librarymanagementsystem.payload.request.GenreRequest;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Collections;
import java.util.Optional;

@Mapper(componentModel = "spring")
public abstract class GenreMapper implements BaseMapper<GenreRequest, GenreResponse, Genre> {
    @Autowired
    protected GenreRepository repository;

    @AfterMapping
    protected void handleToEntity(GenreRequest dto, @MappingTarget Genre genre) {
        if (dto.getParentGenreId() != null) {
            Genre parentGenre = repository.findById(dto.getParentGenreId()).orElseThrow(() -> new GenreException("Parent id is not found " + dto.getParentGenreId()));
            genre.setParentGenre(parentGenre);
        }
    }

    @AfterMapping
    protected void handleToDTO(Genre savedGenre, @MappingTarget GenreResponse response) {
        if (savedGenre.getParentGenre() != null) {
            response.setParentGenreId(savedGenre.getParentGenre().getId());
            response.setParentGenreName(savedGenre.getParentGenre().getName());
        }

        response.setSubGenres(Optional.ofNullable(savedGenre.getSubGenres())
                        .orElseGet(Collections::emptyList)
                        .stream()
                        .filter(Genre::getActive)
                        .map(this::toDTO)
                        .toList());
    }
}
