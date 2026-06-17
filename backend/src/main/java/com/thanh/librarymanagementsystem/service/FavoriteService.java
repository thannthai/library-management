package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.model.Favorite;
import java.util.List;

public interface FavoriteService {
    List<Favorite> getMyFavorites();
    boolean isFavorite(Long bookId);
    Favorite toggleFavorite(Long bookId);
    void removeFavorite(Long bookId);
}
