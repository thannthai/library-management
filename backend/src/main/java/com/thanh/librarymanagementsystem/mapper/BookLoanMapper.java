package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.Author;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.payload.request.BookLoanRequest;
import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.CurrentLoanResponse;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public abstract class BookLoanMapper implements BaseMapper<BookLoanRequest, BookLoanResponse, BookLoan> {

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "bookCopy", ignore = true)  // BookCopy được set thủ công trong Service
    public abstract BookLoan toEntity(BookLoanRequest request);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "bookId", source = "bookCopy.book.id")
    @Mapping(target = "bookTitle", source = "bookCopy.book.title")
    @Mapping(target = "coverImageUrl", source = "bookCopy.book.coverImageUrl")
    @Mapping(target = "isbn", source = "bookCopy.book.isbn")
    @Mapping(target = "authorName", source = "bookCopy.book.authors", qualifiedByName = "mapAuthorsToString")
    public abstract BookLoanResponse toDTO(BookLoan bookLoan);

    @Mapping(target = "bookId", source = "bookCopy.book.id")
    @Mapping(target = "title", source = "bookCopy.book.title")
    @Mapping(target = "authorName", source = "bookCopy.book.authors", qualifiedByName = "mapAuthorsToString")
    @Mapping(target = "coverImageUrl", source = "bookCopy.book.coverImageUrl")
    @Mapping(target = "status", expression = "java(bookLoan.getStatus().name())")
    public abstract CurrentLoanResponse toCurrentLoanResponse(BookLoan bookLoan);

    public abstract List<CurrentLoanResponse> toCurrentLoanResponseList(List<BookLoan> bookLoans);

    @Named("mapAuthorsToString")
    public String mapAuthorsToString(List<Author> authors) {
        if (authors == null) {
            return "";
        }
        return authors.stream()
                .map(Author::getName)
                .collect(Collectors.joining(", "));
    }

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "bookCopy", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    public abstract void updateEntity(BookLoanRequest request, @MappingTarget BookLoan bookLoan);
}

