package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import com.thanh.librarymanagementsystem.enums.PaymentMethod;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import com.thanh.librarymanagementsystem.enums.PaymentType;
import com.thanh.librarymanagementsystem.enums.TransactionStatus;
import com.thanh.librarymanagementsystem.exception.FineException;
import com.thanh.librarymanagementsystem.mapper.FineMapper;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.model.Payment;
import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.response.FineResponse;
import com.thanh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import com.thanh.librarymanagementsystem.repository.FineRepository;
import com.thanh.librarymanagementsystem.repository.PaymentRepository;
import com.thanh.librarymanagementsystem.repository.PaymentTransactionRepository;
import com.thanh.librarymanagementsystem.service.FineService;
import com.thanh.librarymanagementsystem.service.PaymentService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FineServiceImpl implements FineService {

    private static final String DIGITS = "0123456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserService userService;
    private final FineRepository fineRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentService paymentService;
    private final FineMapper fineMapper;

    @Override
    @Transactional
    public PaymentInitiateResponse payFine(Long fineId) {
        User currentUser = userService.getCurrentUser();
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new FineException("Fine not found with id: " + fineId));

        // Kiểm tra xem phạt đã trả hết nợ hoặc đã được miễn giảm chưa
        if (fine.isFullyPaid()) {
            throw new FineException("Fine is already fully paid");
        }
        if (fine.isWaived()) {
            throw new FineException("Fine has been waived and cannot be paid");
        }

        long amountOutstanding = fine.getAmountOutstanding();

        // 1. Tạo bản ghi Payment (PENDING)
        Payment payment = new Payment();
        payment.setUser(currentUser);
        payment.setFine(fine);
        payment.setBookLoan(fine.getBookLoan());
        payment.setType(PaymentType.FINE);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentMethod(PaymentMethod.SEPAY);
        payment.setAmount(amountOutstanding);
        payment.setCurrency("VND");
        Payment savedPayment = paymentRepository.save(payment);

        // 2. Tạo mã đơn hàng duy nhất và lưu PaymentTransaction (PENDING)
        String txnRef = "FN" + fine.getId() + getRandomNumber(8);
        String description = "SEVQR " + txnRef;

        PaymentTransaction paymentTransaction = new PaymentTransaction();
        paymentTransaction.setPayment(savedPayment);
        paymentTransaction.setTxnRef(txnRef);
        paymentTransaction.setAmount(amountOutstanding);
        paymentTransaction.setStatus(TransactionStatus.PENDING);
        paymentTransaction.setDescription(description);
        PaymentTransaction savedPaymentTransaction = paymentTransactionRepository.save(paymentTransaction);

        // 3. Gọi PaymentService để tạo thông tin params submit sang SePay
        SePayCheckoutResponse sePayCheckout = paymentService.createSePayPaymentUrl(savedPaymentTransaction);

        // 4. Trả về Response
        return PaymentInitiateResponse.builder()
                .paymentId(savedPayment.getId())
                .paymentTransactionId(savedPaymentTransaction.getId())
                .txnRef(txnRef)
                .paymentAmount(amountOutstanding)
                .sePayCheckout(sePayCheckout)
                .build();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private String getRandomNumber(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(DIGITS.charAt(SECURE_RANDOM.nextInt(DIGITS.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public FineResponse getFineById(Long id) {
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new FineException("Fine not found with id: " + id));
        return fineMapper.toDTO(fine);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FineResponse> getFinesByBookLoanId(Long bookLoanId) {
        List<Fine> fines = fineRepository.findByBookLoanId(bookLoanId);
        return fineMapper.toDTO(fines);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FineResponse> getMyFines(FineStatus status, FineType type) {
        User currentUser = userService.getCurrentUser();
        List<Fine> fines = fineRepository.findByUserIdAndFilters(currentUser.getId(), status, type);
        return fineMapper.toDTO(fines);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FineResponse> getAllFines(FineStatus status, FineType type, Long userId, Pageable pageable) {
        return fineRepository.findAllWithFilters(userId, status, type, pageable)
                .map(fineMapper::toDTO);
    }

    @Override
    @Transactional
    public FineResponse confirmFinePayment(Long fineId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new FineException("Không tìm thấy khoản phạt với ID: " + fineId));

        if (fine.getStatus() == FineStatus.PAID) {
            throw new FineException("Khoản phạt này đã được thanh toán.");
        }

        fine.setStatus(FineStatus.PAID);
        fine.setAmountPaid(fine.getAmount());
        Fine savedFine = fineRepository.save(fine);

        // Tạo bản ghi Payment cho tiền mặt
        Payment payment = new Payment();
        payment.setUser(fine.getUser());
        payment.setBookLoan(fine.getBookLoan());
        payment.setType(PaymentType.FINE);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentMethod(com.thanh.librarymanagementsystem.enums.PaymentMethod.CASH);
        payment.setAmount(fine.getAmount());
        payment.setCurrency("VND");
        paymentRepository.save(payment);

        return fineMapper.toDTO(savedFine);
    }
}
