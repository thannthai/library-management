package com.thanh.librarymanagementsystem.model;

import com.thanh.librarymanagementsystem.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookReservation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Transient
    private Integer priorityPosition;
}
