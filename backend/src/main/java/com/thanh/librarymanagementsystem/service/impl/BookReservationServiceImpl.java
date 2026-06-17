package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.enums.NotificationType;
import com.thanh.librarymanagementsystem.enums.ReservationStatus;
import com.thanh.librarymanagementsystem.exception.BookException;
import com.thanh.librarymanagementsystem.exception.BookReservationException;
import com.thanh.librarymanagementsystem.exception.UserException;
import com.thanh.librarymanagementsystem.model.*;
import com.thanh.librarymanagementsystem.payload.response.BookReservationResponse;
import com.thanh.librarymanagementsystem.repository.*;
import com.thanh.librarymanagementsystem.service.BookReservationService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookReservationServiceImpl implements BookReservationService {

    private final BookReservationRepository bookReservationRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BookLoanRepository bookLoanRepository;
    private final BookCopyRepository bookCopyRepository;
    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @Override
    @Transactional
    public BookReservationResponse reserveBook(Long bookId) {
        User user = userService.getCurrentUser();

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookException("Không tìm thấy sách với ID: " + bookId));

        // 1. Chỉ VIP mới được đặt trước
        LocalDateTime now = LocalDateTime.now();
        boolean hasActiveSubscription = subscriptionRepository
                .findActiveSubscriptionByUserId(user.getId(), now)
                .stream().anyMatch(Subscription::isValid);

        if (!hasActiveSubscription) {
            throw new BookReservationException("Chỉ hội viên VIP mới có quyền đặt trước sách.");
        }

        // 2. Tối đa 2 đặt trước đồng thời
        int activeReservations = bookReservationRepository.countByUserIdAndStatus(user.getId(), ReservationStatus.PENDING);
        if (activeReservations >= 2) {
            throw new BookReservationException("Bạn đã đạt giới hạn tối đa 2 cuốn sách đặt trước đồng thời.");
        }

        // 3. Phải hết sách mới cho đặt trước
        if (book.getAvailableCopies() != null && book.getAvailableCopies() > 0) {
            throw new BookReservationException("Sách này hiện vẫn còn sẵn trong kho. Bạn có thể mượn trực tiếp thay vì đặt trước.");
        }

        // 4. Không được đặt trùng
        boolean alreadyReserved = bookReservationRepository.existsByUserIdAndBookIdAndStatus(user.getId(), bookId, ReservationStatus.PENDING);
        if (alreadyReserved) {
            throw new BookReservationException("Bạn đã đặt trước cuốn sách này rồi.");
        }

        BookReservation reservation = new BookReservation();
        reservation.setUser(user);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.PENDING);
        
        BookReservation saved = bookReservationRepository.save(reservation);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookReservationResponse> getMyReservations() {
        User user = userService.getCurrentUser();
        List<BookReservation> reservations = bookReservationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        return reservations.stream().map(res -> {
            BookReservationResponse dto = mapToResponse(res);
            if (res.getStatus() == ReservationStatus.PENDING) {
                // Tính toán vị trí trong hàng đợi
                List<BookReservation> queue = bookReservationRepository.findByBookIdAndStatusOrderByCreatedAtAsc(res.getBook().getId(), ReservationStatus.PENDING);
                int position = queue.indexOf(res) + 1;
                dto.setPriorityPosition(position > 0 ? position : null);
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelReservation(Long reservationId) {
        User user = userService.getCurrentUser();
        BookReservation reservation = bookReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BookReservationException("Không tìm thấy đặt trước với ID: " + reservationId));

        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new BookReservationException("Bạn không có quyền hủy đặt trước này.");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BookReservationException("Chỉ có thể hủy đơn đặt trước ở trạng thái PENDING.");
        }

        reservation.setStatus(ReservationStatus.CANCELED);
        bookReservationRepository.save(reservation);
    }

    @Override
    @Transactional
    public void processQueueForReturnedBook(Long bookId) {
        List<BookReservation> queue = bookReservationRepository.findByBookIdAndStatusOrderByCreatedAtAsc(bookId, ReservationStatus.PENDING);
        if (queue.isEmpty()) {
            return;
        }

        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null || book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            return;
        }

        // Lấy người xếp hàng đầu tiên
        BookReservation firstInQueue = queue.get(0);
        
        // Tìm 1 bản sao sách trống
        Optional<BookCopy> availableCopy = bookCopyRepository.findByBookId(bookId)
            .stream().filter(c -> c.getStatus() == com.thanh.librarymanagementsystem.enums.CopyStatus.AVAILABLE).findFirst();

        if (availableCopy.isPresent()) {
            BookCopy copy = availableCopy.get();
            
            // Đánh dấu bản sao đã bị giữ
            copy.setStatus(com.thanh.librarymanagementsystem.enums.CopyStatus.BORROWED);
            bookCopyRepository.save(copy);

            book.setAvailableCopies(book.getAvailableCopies() - 1);
            bookRepository.save(book);

            // Chuyển trạng thái reservation thành FULFILLED
            firstInQueue.setStatus(ReservationStatus.FULFILLED);
            bookReservationRepository.save(firstInQueue);

            // Tạo tự động đơn mượn PENDING_PICKUP
            BookLoan loan = new BookLoan();
            loan.setUser(firstInQueue.getUser());
            loan.setBookCopy(copy);
            loan.setStatus(LoanStatus.PENDING_PICKUP);
            loan.setPaymentStatus("PAID"); // Đã thỏa mãn điều kiện VIP
            loan.setRenewalCount(0);
            loan.setMaxRenewals(1);
            bookLoanRepository.save(loan);

            // Gửi thông báo
            Notification notif = new Notification();
            notif.setUser(firstInQueue.getUser());
            notif.setTitle("Sách đặt trước đã có sẵn!");
            notif.setMessage("Cuốn sách '" + book.getTitle() + "' bạn đặt trước hiện đã sẵn sàng. " +
                "Đơn mượn của bạn đã được tạo tự động. Vui lòng đến quầy nhận sách trong vòng 48h.");
            notif.setType(NotificationType.RESERVATION_READY);
            notificationRepository.save(notif);

            log.info("Processed reservation queue for book {}, allocated to user {}", bookId, firstInQueue.getUser().getId());
        }
    }

    @Override
    @Transactional
    public void expireUnpickedReservations() {
        LocalDateTime expirationTime = LocalDateTime.now().minusHours(48);
        List<BookReservation> expiredReservations = bookReservationRepository.findExpiredReservations(ReservationStatus.FULFILLED, expirationTime);

        for (BookReservation res : expiredReservations) {
            res.setStatus(ReservationStatus.EXPIRED);
            bookReservationRepository.save(res);

            // Tìm đơn mượn PENDING_PICKUP tương ứng và hủy nó
            List<BookLoan> pendingLoans = bookLoanRepository.findByUserIdAndStatusIn(res.getUser().getId(), List.of(LoanStatus.PENDING_PICKUP));
            for (BookLoan loan : pendingLoans) {
                if (loan.getBookCopy().getBook().getId().equals(res.getBook().getId())) {
                    loan.setStatus(LoanStatus.CANCELED);
                    bookLoanRepository.save(loan);

                    // Giải phóng bản sao sách
                    BookCopy copy = loan.getBookCopy();
                    copy.setStatus(com.thanh.librarymanagementsystem.enums.CopyStatus.AVAILABLE);
                    bookCopyRepository.save(copy);

                    Book book = copy.getBook();
                    book.setAvailableCopies(book.getAvailableCopies() + 1);
                    bookRepository.save(book);

                    // Gửi thông báo hủy
                    Notification notif = new Notification();
                    notif.setUser(res.getUser());
                    notif.setTitle("Hủy đơn đặt trước");
                    notif.setMessage("Đơn đặt trước cuốn '" + book.getTitle() + "' đã bị hủy do bạn không đến nhận sách quá 48h.");
                    notif.setType(NotificationType.GENERAL);
                    notificationRepository.save(notif);

                    // Xử lý queue tiếp theo cho cuốn này
                    processQueueForReturnedBook(book.getId());
                    break; // Xử lý 1 cuốn thôi
                }
            }
        }
    }

    private BookReservationResponse mapToResponse(BookReservation res) {
        return BookReservationResponse.builder()
                .id(res.getId())
                .bookId(res.getBook().getId())
                .bookTitle(res.getBook().getTitle())
                .bookCoverImage(res.getBook().getCoverImageUrl())
                .status(res.getStatus().name())
                .createdAt(res.getCreatedAt())
                .build();
    }
}
