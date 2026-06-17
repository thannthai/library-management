package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.model.BookReservation;
import com.thanh.librarymanagementsystem.payload.response.BookReservationResponse;
import com.thanh.librarymanagementsystem.security.UserPrincipal;

import java.util.List;

public interface BookReservationService {

    BookReservationResponse reserveBook(Long bookId);

    List<BookReservationResponse> getMyReservations();

    void cancelReservation(Long reservationId);

    void processQueueForReturnedBook(Long bookId);

    void expireUnpickedReservations();
}
