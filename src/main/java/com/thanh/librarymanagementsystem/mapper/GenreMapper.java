package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class GenreMapper {
    private final GenreRepository repository;

    public Genre toEntity(GenreDTO dto) {
        if (dto == null) return null;

        Genre genre = Genre.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .displayOrder(dto.getDisplayOrder())
                .active(true)
                .build();

        if (dto.getParentGenreId() != null) {
            Genre parentGenre = repository.findById(dto.getParentGenreId()).orElseThrow(() -> new RuntimeException("Parent id is not found " + dto.getParentGenreId()));
            genre.setParentGenre(parentGenre);
        }

        return genre;
    }

    public GenreDTO toDTO(Genre savedGenre) {
        if (savedGenre == null) return null;

        GenreDTO dto = GenreDTO.builder()
                .id(savedGenre.getId())
                .code(savedGenre.getCode())
                .name(savedGenre.getName())
                .description(savedGenre.getDescription())
                .displayOrder(savedGenre.getDisplayOrder())
                .active(true)
                .createdAt(savedGenre.getCreatedAt())
                .updatedAt(savedGenre.getUpdatedAt())
                .build();

        if (savedGenre.getParentGenre() != null) {
            dto.setParentGenreId(savedGenre.getParentGenre().getId());
            dto.setParentGenreName(savedGenre.getParentGenre().getName());
        }

        dto.setSubGenres(Optional.ofNullable(savedGenre.getSubGenres())
                        .orElseGet(Collections::emptyList)
                        .stream()
                        .filter(Genre::getActive)
                        .map(this::toDTO)
                        .toList());

        return dto;
    }
}
