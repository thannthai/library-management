package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.exception.BookException;
import com.thanh.librarymanagementsystem.model.Author;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.model.Genre;
import com.thanh.librarymanagementsystem.model.Publisher;
import com.thanh.librarymanagementsystem.payload.request.BookRequest;
import com.thanh.librarymanagementsystem.payload.response.AuthorResponse;
import com.thanh.librarymanagementsystem.payload.response.BookResponse;
import com.thanh.librarymanagementsystem.payload.response.GenreResponse;
import com.thanh.librarymanagementsystem.payload.response.PublisherResponse;
import com.thanh.librarymanagementsystem.repository.AuthorRepository;
import com.thanh.librarymanagementsystem.repository.GenreRepository;
import com.thanh.librarymanagementsystem.repository.PublisherRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Optional;

@Mapper(componentModel = "spring")
public abstract class BookMapper implements BaseMapper<BookRequest, BookResponse, Book> {
    @Autowired
    protected AuthorRepository authorRepository;

    @Autowired
    protected GenreRepository genreRepository;

    @Autowired
    protected PublisherRepository publisherRepository;

    @Autowired
    protected GenreMapper genreMapper;

    @AfterMapping
    protected void handleToEntity(BookRequest request, @MappingTarget Book book) {
        if (request.getPublisherId() != null) {
            Publisher publisher = publisherRepository.findById(request.getPublisherId())
                    .orElseThrow(() -> new BookException("Publisher not found"));
            book.setPublisher(publisher);
        }

        if (!CollectionUtils.isEmpty(request.getAuthorIds())) {
            List<Author> authors = authorRepository.findAllById(request.getAuthorIds());
            if (request.getAuthorIds().size() != authors.size()) {
                throw new BookException("One or more authors not found");
            }
            book.setAuthors(authors);
        }

        if (!CollectionUtils.isEmpty(request.getGenreIds())) {
            List<Genre> genres = genreRepository.findAllById(request.getGenreIds());
            if (request.getGenreIds().size() != genres.size()) {
                throw new BookException("One or more genres not found");
            }
            book.setGenres(genres);
        }
    }

    @AfterMapping
    protected void handleToDTO(Book book, @MappingTarget BookResponse response) {
        if (!CollectionUtils.isEmpty(book.getAuthors())) {
            List<AuthorResponse> authorResponses = book.getAuthors().stream()
                    .map(author -> new AuthorResponse(author.getId(), author.getName()))
                    .toList();
            response.setAuthors(authorResponses);
        }

        if (!CollectionUtils.isEmpty(book.getGenres())) {
            List<GenreResponse> genreResponses = book.getGenres().stream()
                    .map(genreMapper::toDTO)
                    .toList();
            response.setGenres(genreResponses);
        }

        Optional.ofNullable(book.getPublisher())
                .ifPresent(p -> response.setPublisher(new PublisherResponse(book.getPublisher().getId(), book.getPublisher().getName())));
    }
}
