package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTxnRef(String txnRef);
    Optional<PaymentTransaction> findFirstByPaymentIdAndStatusOrderByIdDesc(Long paymentId, TransactionStatus status);
    List<PaymentTransaction> findByPaymentId(Long paymentId);
}
