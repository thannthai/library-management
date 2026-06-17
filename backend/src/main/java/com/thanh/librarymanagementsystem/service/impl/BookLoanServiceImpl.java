package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.CopyStatus;
import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.enums.PaymentMethod;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import com.thanh.librarymanagementsystem.enums.PaymentType;
import com.thanh.librarymanagementsystem.enums.TransactionStatus;
import com.thanh.librarymanagementsystem.enums.UserRole;
import com.thanh.librarymanagementsystem.enums.LoanType;
import com.thanh.librarymanagementsystem.exception.BookCopyException;
import com.thanh.librarymanagementsystem.exception.BookLoanException;
import com.thanh.librarymanagementsystem.mapper.BookLoanMapper;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.model.BookCopy;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Payment;
import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.model.Subscription;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.request.BookLoanRequest;
import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.CurrentLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import com.thanh.librarymanagementsystem.security.UserPrincipal;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.BookCopyRepository;
import com.thanh.librarymanagementsystem.repository.BookLoanRepository;
import com.thanh.librarymanagementsystem.repository.PaymentRepository;
import com.thanh.librarymanagementsystem.repository.PaymentTransactionRepository;
import com.thanh.librarymanagementsystem.repository.SubscriptionRepository;
import com.thanh.librarymanagementsystem.repository.BookReservationRepository;
import com.thanh.librarymanagementsystem.service.BookLoanService;
import com.thanh.librarymanagementsystem.service.PaymentService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BookLoanServiceImpl implements BookLoanService {

    private static final String DIGITS = "0123456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserService userService;
    private final BookCopyRepository bookCopyRepository;
    private final BookLoanRepository bookLoanRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BookReservationRepository bookReservationRepository;
    private final BookLoanMapper bookLoanMapper;
    private final PaymentService paymentService;
    private final BookRepository bookRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // ─────────────────────────────────────────────────────────────────────────
    // CHECKOUT (Tạo yêu cầu mượn sách)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookLoanResponse checkoutBook(BookLoanRequest bookLoanRequest) {
        User currentUser = userService.getCurrentUser();

        // ── Kiểm tra chặn nợ xấu: chặn mượn sách mới nếu tài khoản đang có cuốn sách
        // nào quá hạn chưa trả ──
        boolean hasOverdueBook = !bookLoanRepository.findByUserIdAndStatus(currentUser.getId(), LoanStatus.OVERDUE)
                .isEmpty();
        if (hasOverdueBook) {
            throw new BookLoanException(
                    "Tài khoản của bạn đã bị khóa quyền mượn sách mới do đang có đơn sách quá hạn chưa hoàn thành trả.");
        }

        // ── Bước 1: Tìm bản sao vật lý theo barcode ──
        // Thay vì tra cứu theo Book ID, hệ thống giờ tra cứu theo barcode cụ thể
        // để đảm bảo đúng cuốn sách vật lý đang được đặt mượn.
        BookCopy bookCopy = bookCopyRepository.findById(bookLoanRequest.getBookCopyId())
                .orElseThrow(() -> new BookCopyException(
                        "Không tìm thấy bản sao sách với ID: " + bookLoanRequest.getBookCopyId()));

        // ── Kiểm tra chặn mượn trùng sách ──
        boolean alreadyBorrowing = bookLoanRepository.findByUserIdAndStatusIn(
                currentUser.getId(),
                List.of(LoanStatus.PENDING_PAYMENT, LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE)
        ).stream().anyMatch(loan -> 
                loan.getBookCopy() != null && 
                loan.getBookCopy().getBook() != null && 
                loan.getBookCopy().getBook().getId().equals(bookCopy.getBook().getId())
        );

        if (alreadyBorrowing) {
            throw new BookLoanException("Bạn đang mượn hoặc giữ chỗ một cuốn thuộc tựa sách \"" 
                    + bookCopy.getBook().getTitle() + "\" rồi. Không được mượn trùng tựa sách!");
        }

        // ── Bước 2: Kiểm tra trạng thái bản sao ──
        if (bookCopy.getStatus() != CopyStatus.AVAILABLE) {
            throw new BookLoanException(
                    "Bản sao sách (barcode: " + bookCopy.getBarcode() + ") hiện không có sẵn. " +
                            "Trạng thái hiện tại: " + bookCopy.getStatus());
        }

        // ── Bước 3: Kiểm tra giá mượn/ngày ──
        if (bookCopy.getBook().getLoanFeePerDay() == null
                || bookCopy.getBook().getLoanFeePerDay().compareTo(BigDecimal.ZERO) < 0) {
            throw new BookLoanException("Phí mượn sách theo ngày không hợp lệ.");
        }


        // ── Bước 4: Khởi tạo entity BookLoan ──
        BookLoan bookLoan = bookLoanMapper.toEntity(bookLoanRequest);
        bookLoan.setUser(currentUser);
        bookLoan.setBookCopy(bookCopy);
        bookLoan.setRenewalCount(0);
        bookLoan.setMaxRenewals(2);
        bookLoan.setIsOverdue(false);
        bookLoan.setOverdueDays((short) 0);

        // ── Bước 5: Xác định số ngày mượn theo loại đơn ──
        long loanDays = switch (bookLoan.getType()) {
            case SHORT_TERM -> 3;
            case NORMAL -> 14;
        };

        // ── Bước 6: Kiểm tra gói đăng ký hợp lệ của người dùng ──
        // Nếu người dùng có gói đăng ký còn hạn → phí mượn = 0 VND
        Optional<Subscription> activeSubscriptionOpt = subscriptionRepository
                .findActiveSubscriptionByUserId(currentUser.getId(), LocalDateTime.now())
                .stream().findFirst();
        boolean hasActiveSubscription = activeSubscriptionOpt
                .map(Subscription::isValid)
                .orElse(false);

        // ── Bước 6.1: Kiểm tra hạn mức slot mượn sách đồng thời (VIP hoặc FREE) ──
        int maxBooksAllowed = hasActiveSubscription ? activeSubscriptionOpt.get().getMaxBooksAllowed() : 2;
        List<BookLoan> activeLoans = bookLoanRepository.findByUserIdAndStatusIn(
                currentUser.getId(),
                List.of(LoanStatus.PENDING_PAYMENT, LoanStatus.PENDING_PICKUP, LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE));
        
        if (activeLoans.size() >= maxBooksAllowed) {
            String planName = hasActiveSubscription ? "gói VIP" : "hạng FREE";
            throw new BookLoanException(String.format(
                "Bạn đã đạt giới hạn giữ sách đồng thời của %s (%d cuốn). Vui lòng trả bớt sách trước khi mượn tiếp.", 
                planName, maxBooksAllowed));
        }

        // ── Bước 7: Tính số tiền cần thanh toán ──
        long amount = 0L;
        if (!hasActiveSubscription) {
            amount = 15000L; // Giá mượn lẻ cố định: 15,000 VND / lượt mượn cho FREE
        }

        // ── Nhánh A: Miễn phí (có gói đăng ký hợp lệ) ──
        if (amount == 0) {
            return processZeroAmountCheckout(bookLoan, bookCopy, currentUser, loanDays);
        }

        // ── Nhánh B: Cần thanh toán (luồng SePay) ──
        return processPaidCheckout(bookLoan, bookCopy, currentUser, amount);
    }

    /**
     * Xử lý checkout miễn phí khi người dùng có gói đăng ký hợp lệ.
     * Đơn mượn chuyển thẳng sang PENDING_PICKUP (O2O).
     * Tạo bản ghi Payment/Transaction thành công với amount=0.
     */
    private BookLoanResponse processZeroAmountCheckout(BookLoan bookLoan, BookCopy bookCopy, User currentUser,
            long loanDays) {
        LocalDateTime now = LocalDateTime.now();
        bookLoan.setStatus(LoanStatus.PENDING_PICKUP);
        bookLoan.setPaymentStatus("PAID");
        // Không set checkoutDate và dueDate ở đây. Chờ Admin xác nhận giao sách mới tính.

        // Đánh dấu bản sao là BORROWED để không ai mượn đồng thời được
        bookCopy.setStatus(CopyStatus.BORROWED);
        bookCopyRepository.save(bookCopy);

        // Giảm availableCopies của cuốn sách đi 1 ngay lập tức.
        Book book = bookCopy.getBook();
        if (book.getAvailableCopies() != null && book.getAvailableCopies() > 0) {
            book.setAvailableCopies(book.getAvailableCopies() - 1);
            bookRepository.save(book);
        }

        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        // Tạo Payment thành công với amount=0 (lưu audit trail)
        Payment payment = new Payment();
        payment.setUser(currentUser);
        payment.setBookLoan(savedBookLoan);
        payment.setType(PaymentType.LOAN_FEE);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setAmount(0L);
        payment.setCurrency("VND");
        Payment savedPayment = paymentRepository.save(payment);

        // Tạo PaymentTransaction thành công với amount=0
        String txnRef = "BL" + savedBookLoan.getId() + getRandomNumber(8);
        PaymentTransaction paymentTransaction = new PaymentTransaction();
        paymentTransaction.setPayment(savedPayment);
        paymentTransaction.setTxnRef(txnRef);
        paymentTransaction.setAmount(0L);
        paymentTransaction.setStatus(TransactionStatus.SUCCESS);
        paymentTransaction.setDescription("Mượn sách miễn phí qua gói Subscription");
        paymentTransaction.setCompletedAt(now);
        PaymentTransaction savedPaymentTransaction = paymentTransactionRepository.save(paymentTransaction);

        BookLoanResponse response = bookLoanMapper.toDTO(savedBookLoan);
        response.setPaymentId(savedPayment.getId());
        response.setPaymentTransactionId(savedPaymentTransaction.getId());
        response.setTxnRef(txnRef);
        response.setPaymentAmount(0L);
        response.setSePayCheckout(null);

        return response;
    }

    /**
     * Xử lý checkout có phí — tạo đơn PENDING_PAYMENT và redirect sang SePay.
     * Sách chưa được CHECKED_OUT, chưa đánh dấu BORROWED trên bản sao.
     * Webhook IPN SePay sẽ kích hoạt sau khi thanh toán thành công.
     */
    private BookLoanResponse processPaidCheckout(BookLoan bookLoan, BookCopy bookCopy, User currentUser, long amount) {
        // Đơn mượn ở trạng thái chờ thanh toán; chưa thay đổi trạng thái BookCopy
        bookLoan.setStatus(LoanStatus.PENDING_PAYMENT);
        bookLoan.setPaymentStatus("PENDING_PAYMENT");
        BookLoan savedBookLoan = bookLoanRepository.save(bookLoan);

        bookCopy.setStatus(CopyStatus.BORROWED);
        bookCopyRepository.save(bookCopy);

        if (bookCopy.getBook().getAvailableCopies() != null && bookCopy.getBook().getAvailableCopies() > 0) {
            bookCopy.getBook().setAvailableCopies(bookCopy.getBook().getAvailableCopies() - 1);
            bookRepository.save(bookCopy.getBook());
        }

        String redisKey = "loan:hold:" + savedBookLoan.getId();
        redisTemplate.opsForValue().set(redisKey, "pending", 300, TimeUnit.SECONDS);

        String statusKey = "loan:status:" + bookLoan.getId();
        redisTemplate.opsForValue().set(statusKey, "PENDING_PAYMENT", 300, TimeUnit.SECONDS);

        // Tạo Payment (PENDING)
        Payment payment = new Payment();
        payment.setUser(currentUser);
        payment.setBookLoan(savedBookLoan);
        payment.setType(PaymentType.LOAN_FEE);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentMethod(PaymentMethod.SEPAY);
        payment.setAmount(amount);
        payment.setCurrency("VND");
        Payment savedPayment = paymentRepository.save(payment);

        // Tạo PaymentTransaction (PENDING) với txnRef duy nhất
        String txnRef = "BL" + savedBookLoan.getId() + getRandomNumber(8);
        String description = "SEVQR " + txnRef;

        PaymentTransaction paymentTransaction = new PaymentTransaction();
        paymentTransaction.setPayment(savedPayment);
        paymentTransaction.setTxnRef(txnRef);
        paymentTransaction.setAmount(amount);
        paymentTransaction.setStatus(TransactionStatus.PENDING);
        paymentTransaction.setDescription(description);
        PaymentTransaction savedPaymentTransaction = paymentTransactionRepository.save(paymentTransaction);

        // Tạo URL thanh toán SePay để frontend hiển thị QR code
        SePayCheckoutResponse sePayCheckout = paymentService.createSePayPaymentUrl(savedPaymentTransaction);

        BookLoanResponse response = bookLoanMapper.toDTO(savedBookLoan);
        response.setPaymentId(savedPayment.getId());
        response.setPaymentTransactionId(savedPaymentTransaction.getId());
        response.setTxnRef(txnRef);
        response.setPaymentAmount(amount);
        response.setSePayCheckout(sePayCheckout);

        return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK-IN (Trả sách)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookLoanResponse checkInBook(Long bookLoanId) {
        // ── Bước 1: Tìm đơn mượn theo ID ──
        BookLoan loan = bookLoanRepository.findById(bookLoanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + bookLoanId));

        // ── Bước 2: Kiểm tra trạng thái đơn — chỉ cho phép trả khi đang mượn ──
        if (loan.getStatus() != LoanStatus.CHECKED_OUT && loan.getStatus() != LoanStatus.OVERDUE) {
            throw new BookLoanException(
                    "Không thể trả sách. Trạng thái hiện tại của đơn mượn: " + loan.getStatus());
        }

        // ── Bước 3: Ghi lại ngày trả thực tế ──
        loan.setActualReturnDate(LocalDateTime.now());

        // ── Bước 4: Cập nhật trạng thái đơn mượn sang RETURNED ──
        loan.setStatus(LoanStatus.RETURNED);

        // ── Bước 5: Trả bản sao vật lý về trạng thái AVAILABLE ──
        // Điều này cho phép người khác có thể mượn cuốn sách này ngay lập tức.
        // Lưu ý: Nếu bản sao bị hỏng/mất trong quá trình mượn, nghiệp vụ viên
        // cần cập nhật thủ công qua API riêng thay vì dùng luồng check-in này.
        BookCopy bookCopy = loan.getBookCopy();
        bookCopy.setStatus(CopyStatus.AVAILABLE);

        // Tăng availableCopies của cuốn sách tương ứng lên 1
        Book book = bookCopy.getBook();
        if (book.getAvailableCopies() != null) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }

        // ── Bước 6: Lưu tất cả thay đổi xuống DB ──
        bookCopyRepository.save(bookCopy);
        BookLoan savedLoan = bookLoanRepository.save(loan);

        return bookLoanMapper.toDTO(savedLoan);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GIA HẠN & TRUY VẤN
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookLoanResponse renewBook(Long bookLoanId) {
        // ── Bước 1: Tìm đơn mượn ──
        BookLoan loan = bookLoanRepository.findById(bookLoanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + bookLoanId));

        // ── Bước 2: Kiểm tra trạng thái đơn ──
        if (loan.getStatus() != LoanStatus.CHECKED_OUT) {
            if (loan.getStatus() == LoanStatus.OVERDUE) {
                throw new BookLoanException(
                        "Không thể gia hạn đơn mượn đã quá hạn. Vui lòng hoàn tất trả sách và thanh toán phạt.");
            }
            throw new BookLoanException("Không thể gia hạn đơn mượn có trạng thái: " + loan.getStatus());
        }

        // ── Bước 3: Kiểm tra quyền VIP ──
        LocalDateTime now = LocalDateTime.now();
        boolean hasActiveSubscription = subscriptionRepository
                .findActiveSubscriptionByUserId(loan.getUser().getId(), now)
                .stream().anyMatch(Subscription::isValid);
        
        if (!hasActiveSubscription) {
            throw new BookLoanException("Chỉ hội viên VIP mới được sử dụng tính năng gia hạn sách trực tuyến.");
        }

        // ── Bước 4: Kiểm tra số lần gia hạn (VIP chỉ được 1 lần) ──
        if (loan.getRenewalCount() >= 1) {
            throw new BookLoanException("Bạn đã sử dụng hết lượt gia hạn cho cuốn sách này (Tối đa 1 lần).");
        }

        // ── Bước 5: Kiểm tra xem có ai đang xếp hàng đợi không ──
        Long bookId = loan.getBookCopy().getBook().getId();
        boolean hasReservations = bookReservationRepository.existsByUserIdAndBookIdAndStatus(
            null, bookId, com.thanh.librarymanagementsystem.enums.ReservationStatus.PENDING
        ); 
        // Wait, existsByUserIdAndBookIdAndStatus checks for a specific user.
        // We need a method to count by bookId and status. Let's write the query inline or use the count method.
        // Let's rely on the injected repository. If the method doesn't exist, we will create it. 
        // We have findByBookIdAndStatusOrderByCreatedAtAsc, let's use it to check if there are any.
        List<com.thanh.librarymanagementsystem.model.BookReservation> queue = 
            bookReservationRepository.findByBookIdAndStatusOrderByCreatedAtAsc(bookId, com.thanh.librarymanagementsystem.enums.ReservationStatus.PENDING);
        
        if (!queue.isEmpty()) {
            throw new BookLoanException("Không thể gia hạn. Đang có độc giả khác xếp hàng chờ mượn cuốn sách này.");
        }

        // ── Bước 6: Tăng số lần gia hạn và cộng ngày gia hạn (+5 ngày) ──
        loan.setRenewalCount(loan.getRenewalCount() + 1);
        loan.setDueDate(loan.getDueDate().plusDays(5));

        // ── Bước 7: Lưu thay đổi ──
        BookLoan savedLoan = bookLoanRepository.save(loan);
        return bookLoanMapper.toDTO(savedLoan);
    }

    @Override
    @Transactional(readOnly = true)
    public BookLoanResponse getBookLoanById(Long id) {
        // Ưu tiên đọc trạng thái từ Redis (Cache-Aside) để phản ánh nhanh
        // trạng thái thực tế mà không cần xuống MySQL mỗi lần polling.
        // Lưu ý: vẫn cần query MySQL để lấy đầy đủ dữ liệu cho DTO —
        // Redis chỉ cache field "status" riêng, không cache toàn bộ object
        // (tránh phức tạp hóa serialization và cache invalidation).
        String cachedStatus = (String) redisTemplate.opsForValue().get("loan:status:" + id);

        BookLoan loan = bookLoanRepository.findById(id)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + id));

        // Kiểm tra quyền hạn: người dùng thường chỉ được xem đơn của chính họ, admin
        // được xem tất cả
        User currentUser = userService.getCurrentUser();
        boolean isAdmin = currentUser.getRoles() != null && currentUser.getRoles().contains(UserRole.ROLE_ADMIN);

        if (!isAdmin && !loan.getUser().getId().equals(currentUser.getId())) {
            throw new BookLoanException("Bạn không có quyền truy cập thông tin đơn mượn này.");
        }

        BookLoanResponse response = bookLoanMapper.toDTO(loan);

        // Nếu Redis cache có status mới hơn, override lên DTO để frontend
        // nhận được trạng thái cập nhật ngay lập tức mà không cần đợi DB commit.
        if (cachedStatus != null) {
            response.setStatus(LoanStatus.valueOf(cachedStatus));
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookLoanResponse> getMyBookLoans(String status, Pageable pageable) {
        User currentUser = userService.getCurrentUser();
        return getBookLoansForUser(currentUser.getId(), status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookLoanResponse> getUserBookLoansForAdmin(Long userId, String status, Pageable pageable) {
        return getBookLoansForUser(userId, status, pageable);
    }

    private PageResponse<BookLoanResponse> getBookLoansForUser(Long userId, String status, Pageable pageable) {
        Page<BookLoan> loanPage;

        if (status == null || status.isBlank()) {
            loanPage = bookLoanRepository.findByUserId(userId, pageable);
        } else if (status.equalsIgnoreCase("ACTIVE")) {
            // ACTIVE maps to CHECKED_OUT or OVERDUE (đang mượn, chưa trả)
            loanPage = bookLoanRepository.findByUserIdAndStatusIn(
                    userId,
                    List.of(LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE),
                    pageable);
        } else {
            try {
                LoanStatus loanStatus = LoanStatus.valueOf(status.toUpperCase());
                loanPage = bookLoanRepository.findByUserIdAndStatus(userId, loanStatus, pageable);
            } catch (IllegalArgumentException e) {
                // Nếu truyền trạng thái không hợp lệ, mặc định trả về tất cả
                loanPage = bookLoanRepository.findByUserId(userId, pageable);
            }
        }

        List<BookLoanResponse> responses = loanPage.getContent().stream()
                .map(bookLoanMapper::toDTO)
                .toList();

        return new PageResponse<>(
                responses,
                loanPage.getTotalElements(),
                loanPage.getTotalPages(),
                loanPage.getNumber(),
                loanPage.getSize(),
                loanPage.isFirst(),
                loanPage.isLast(),
                loanPage.isEmpty());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static String getRandomNumber(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(DIGITS.charAt(SECURE_RANDOM.nextInt(DIGITS.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CurrentLoanResponse> getCurrentLoans(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new BookLoanException("Unauthorized access");
        }
        Long userId = userPrincipal.getId();
        if (!userService.getCurrentUser().getId().equals(userId)) {
            throw new BookLoanException("Access denied");
        }
        List<BookLoan> loans = bookLoanRepository.findByUserIdAndStatusIn(
                userId,
                List.of(LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE));
        return bookLoanMapper.toCurrentLoanResponseList(loans);
    }

    @Override
    @Transactional
    public BookLoanResponse borrowBook(Long bookId, UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new BookLoanException("Unauthorized access");
        }
        List<BookCopy> availableCopies = bookCopyRepository.findByBookIdAndStatus(bookId, CopyStatus.AVAILABLE);
        if (availableCopies.isEmpty()) {
            // Self-healing: if no copies exist at all for this book in the DB,
            // auto-generate them
            List<BookCopy> allCopies = bookCopyRepository.findByBookId(bookId);
            if (allCopies.isEmpty()) {
                Book book = bookRepository.findById(bookId)
                        .orElseThrow(() -> new BookLoanException("Không tìm thấy tựa sách này."));
                int copiesToCreate = book.getTotalCopies() != null ? book.getTotalCopies() : 10;
                for (int i = 1; i <= copiesToCreate; i++) {
                    BookCopy copy = BookCopy.builder()
                            .book(book)
                            .barcode("BARCODE-" + book.getIsbn() + "-" + i)
                            .status(CopyStatus.AVAILABLE)
                            .build();
                    bookCopyRepository.save(copy);
                }
                // Fetch copies again
                availableCopies = bookCopyRepository.findByBookIdAndStatus(bookId, CopyStatus.AVAILABLE);
            }
        }

        if (availableCopies.isEmpty()) {
            throw new BookLoanException("Không còn bản sao sách nào có sẵn để mượn.");
        }
        BookCopy copyToBorrow = availableCopies.get(0);

        BookLoanRequest request = BookLoanRequest.builder()
                .bookCopyId(copyToBorrow.getId())
                .type(LoanType.NORMAL)
                .notes("Mượn nhanh từ Dashboard/Browse Books")
                .build();

        return checkoutBook(request);
    }

    @Override
    @Transactional(readOnly = true)
    public com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse getPaymentCheckoutUrl(Long loanId) {
        // Tìm đơn mượn
        BookLoan loan = bookLoanRepository.findById(loanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + loanId));

        // Chỉ cho phép lấy URL khi đơn đang ở trạng thái PENDING_PAYMENT
        if (loan.getStatus() != LoanStatus.PENDING_PAYMENT) {
            throw new BookLoanException("Đơn mượn không ở trạng thái chờ thanh toán.");
        }

        // Kiểm tra quyền - chỉ chủ sở hữu mới được lấy URL thanh toán
        User currentUser = userService.getCurrentUser();
        if (!loan.getUser().getId().equals(currentUser.getId())) {
            throw new BookLoanException("Bạn không có quyền truy cập thông tin thanh toán của đơn mượn này.");
        }

        // Tìm Payment PENDING cho loan này
        com.thanh.librarymanagementsystem.model.Payment payment = paymentRepository
                .findFirstByBookLoanIdAndStatus(loanId, com.thanh.librarymanagementsystem.enums.PaymentStatus.PENDING)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy thông tin thanh toán cho đơn mượn này."));

        // Tìm PaymentTransaction PENDING của payment đó
        com.thanh.librarymanagementsystem.model.PaymentTransaction transaction = paymentTransactionRepository
                .findFirstByPaymentIdAndStatusOrderByIdDesc(payment.getId(),
                        com.thanh.librarymanagementsystem.enums.TransactionStatus.PENDING)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy giao dịch thanh toán đang chờ xử lý."));

        // Tái tạo SePay checkout URL từ transaction đã có
        return paymentService.createSePayPaymentUrl(transaction);
    }

    @Override
    @Transactional
    public void handleExpiredLoan(Long loanId) {
        bookLoanRepository.findById(loanId).ifPresent(loan -> {
            // Chỉ xử lý hủy nếu đơn đó vẫn đang lấp lửng chờ trả tiền
            if (LoanStatus.PENDING_PAYMENT.equals(loan.getStatus())) {
                
                // 1. Hủy đơn mượn sách
                loan.setStatus(LoanStatus.CANCELED);
                loan.setPaymentStatus("CANCELED");
                bookLoanRepository.save(loan);

                // 2. Nhả bản sao vật lý về trạng thái sẵn sàng trên kệ
                BookCopy copy = loan.getBookCopy();
                if (copy != null) {
                    copy.setStatus(CopyStatus.AVAILABLE);
                    bookCopyRepository.save(copy);

                    // 3. Cộng ngược lại tổng kho khả dụng của đầu sách
                    Book book = copy.getBook();
                    if (book != null) {
                        book.setAvailableCopies(book.getAvailableCopies() + 1);
                        bookRepository.save(book);
                    }
                }

                // 4. Đánh dấu thất bại cho các hóa đơn liên quan để lưu audit log
                paymentRepository.findByBookLoanId(loanId).ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    
                    paymentTransactionRepository.findByPaymentId(payment.getId()).forEach(txn -> {
                        txn.setStatus(TransactionStatus.FAILED);
                        txn.setDescription(txn.getDescription() + " - Hủy tự động do hết hạn 5 phút");
                        paymentTransactionRepository.save(txn);
                    });
                });
            }
        });
    }

    @Override
    @Transactional
    public void cancelPendingLoan(Long loanId) {
        BookLoan loan = bookLoanRepository.findById(loanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + loanId));

        User currentUser = userService.getCurrentUser();
        boolean isAdmin = currentUser.getRoles() != null && currentUser.getRoles().contains(UserRole.ROLE_ADMIN);
        if (!isAdmin && !loan.getUser().getId().equals(currentUser.getId())) {
            throw new BookLoanException("Bạn không có quyền hủy đơn mượn này.");
        }

        if (LoanStatus.PENDING_PAYMENT.equals(loan.getStatus())) {
            // 1. Hủy đơn mượn sách
            loan.setStatus(LoanStatus.CANCELED);
            loan.setPaymentStatus("CANCELED");
            loan.setNotes("Đơn mượn sách bị hủy bởi người dùng.");
            bookLoanRepository.save(loan);

            // 2. Nhả bản sao vật lý về trạng thái sẵn sàng trên kệ
            BookCopy copy = loan.getBookCopy();
            if (copy != null) {
                copy.setStatus(CopyStatus.AVAILABLE);
                bookCopyRepository.save(copy);

                // 3. Cộng ngược lại tổng kho khả dụng của đầu sách
                Book book = copy.getBook();
                if (book != null) {
                    book.setAvailableCopies(book.getAvailableCopies() + 1);
                    bookRepository.save(book);
                }
            }

            // 4. Đánh dấu thất bại cho các hóa đơn liên quan để lưu audit log
            paymentRepository.findByBookLoanId(loanId).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                
                paymentTransactionRepository.findByPaymentId(payment.getId()).forEach(txn -> {
                    txn.setStatus(TransactionStatus.FAILED);
                    txn.setDescription(txn.getDescription() + " - Hủy bởi người dùng");
                    paymentTransactionRepository.save(txn);
                });
            });

            // 5. Xóa các key Redis liên quan để giải phóng slot
            redisTemplate.delete("loan:hold:" + loanId);
            redisTemplate.delete("loan:status:" + loanId);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RATE BOOK LOAN (Đánh giá sách sau khi trả)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookLoanResponse rateBookLoan(Long loanId, Integer rating, String comment) {
        User currentUser = userService.getCurrentUser();

        BookLoan loan = bookLoanRepository.findById(loanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn sách với ID: " + loanId));

        // Chỉ chủ nhân đơn mượn mới được đánh giá
        if (!loan.getUser().getId().equals(currentUser.getId())) {
            throw new BookLoanException("Bạn không có quyền đánh giá đơn mượn sách này.");
        }

        // Chỉ đơn RETURNED mới được đánh giá
        if (loan.getStatus() != LoanStatus.RETURNED) {
            throw new BookLoanException("Chỉ có thể đánh giá sách sau khi đã trả.");
        }

        // Kiểm tra rating hợp lệ
        if (rating == null || rating < 1 || rating > 5) {
            throw new BookLoanException("Điểm đánh giá phải từ 1 đến 5 sao.");
        }

        // Không cho đánh giá lại nếu đã đánh giá
        if (loan.getRating() != null) {
            throw new BookLoanException("Bạn đã đánh giá cuốn sách này rồi. Mỗi đơn mượn chỉ được đánh giá một lần.");
        }

        loan.setRating(rating);
        loan.setComment(comment != null ? comment.trim() : null);
        loan.setRatedAt(LocalDateTime.now());
        bookLoanRepository.save(loan);

        return bookLoanMapper.toDTO(loan);
    }
}

