package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
import com.thanh.librarymanagementsystem.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {
    private final GenreService service;

    @PostMapping("/createGenre")
    public ResponseEntity<GenreDTO> addGenre(@RequestBody GenreDTO genreDTO) {
        GenreDTO createdGenre = service.createGenre(genreDTO);
        return ResponseEntity.ok(createdGenre);
    }
}
