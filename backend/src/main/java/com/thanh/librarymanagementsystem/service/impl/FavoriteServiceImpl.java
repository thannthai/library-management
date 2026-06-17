package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.BookException;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.model.Favorite;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.FavoriteRepository;
import com.thanh.librarymanagementsystem.service.FavoriteService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final BookRepository bookRepository;
    private final UserService userService;

    @Override
    public List<Favorite> getMyFavorites() {
        User currentUser = userService.getCurrentUser();
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }

    @Override
    public boolean isFavorite(Long bookId) {
        User currentUser = userService.getCurrentUser();
        return favoriteRepository.existsByUserIdAndBookId(currentUser.getId(), bookId);
    }

    @Override
    @Transactional
    public Favorite toggleFavorite(Long bookId) {
        User currentUser = userService.getCurrentUser();
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookException("Book not found with id: " + bookId));

        Optional<Favorite> existing = favoriteRepository.findByUserIdAndBookId(currentUser.getId(), bookId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return null; // Signals it was removed
        } else {
            Favorite favorite = Favorite.builder()
                    .user(currentUser)
                    .book(book)
                    .build();
            return favoriteRepository.save(favorite);
        }
    }

    @Override
    @Transactional
    public void removeFavorite(Long bookId) {
        User currentUser = userService.getCurrentUser();
        favoriteRepository.findByUserIdAndBookId(currentUser.getId(), bookId)
                .ifPresent(favoriteRepository::delete);
    }
}
