package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;

public interface GenreService {
    GenreDTO createGenre(GenreDTO genreDTO);
}
