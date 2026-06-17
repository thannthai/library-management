package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.SubscriptionException;
import com.thanh.librarymanagementsystem.exception.SubscriptionPlanException;
import com.thanh.librarymanagementsystem.mapper.SubscriptionMapper;
import com.thanh.librarymanagementsystem.model.Subscription;
import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.request.SubscriptionRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionResponse;
import com.thanh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.thanh.librarymanagementsystem.repository.SubscriptionRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.service.SubscriptionService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.thanh.librarymanagementsystem.model.Payment;
import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.repository.PaymentRepository;
import com.thanh.librarymanagementsystem.repository.PaymentTransactionRepository;
import com.thanh.librarymanagementsystem.service.PaymentService;
import com.thanh.librarymanagementsystem.enums.PaymentType;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import com.thanh.librarymanagementsystem.enums.PaymentMethod;
import com.thanh.librarymanagementsystem.enums.TransactionStatus;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {
    private static final String DIGITS = "0123456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentService paymentService;

    private final SubscriptionMapper subscriptionMapper;
    private final UserService userService;


    @Override
    public SubscriptionResponse subscribe(SubscriptionRequest subscriptionRequest) {
        User currentUser = userService.getCurrentUser();

        SubscriptionPlan plan = subscriptionPlanRepository.findById(subscriptionRequest.getSubscriptionPlanId())
                .orElseThrow(() -> new SubscriptionPlanException("Subscription Plan Not Found"));

        Subscription subscription = subscriptionMapper.toEntity(subscriptionRequest);
        subscription.setUser(currentUser);
        subscription.setSubscriptionPlan(plan);

        subscription.initializeFromPlan();
        
        long amount = 0L;
        if (plan.getPrice() != null) {
            amount = plan.getPrice().longValue();
        }

        if (amount == 0) {
            // Free plan -> Kích hoạt ngay lập tức
            subscription.setIsActive(true);
            subscription.setStartDate(LocalDateTime.now());
            subscription.calculateEndDate();
            Subscription savedSubscription = subscriptionRepository.save(subscription);

            // Tạo bản ghi Payment thành công với số tiền 0đ để lưu vết kiểm toán
            Payment payment = new Payment();
            payment.setUser(currentUser);
            payment.setSubscription(savedSubscription);
            payment.setType(PaymentType.SUBSCRIPTION);
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setAmount(0L);
            payment.setCurrency("VND");
            Payment savedPayment = paymentRepository.save(payment);

            String txnRef = "SUB" + savedSubscription.getId() + getRandomNumber(8);
            PaymentTransaction paymentTransaction = new PaymentTransaction();
            paymentTransaction.setPayment(savedPayment);
            paymentTransaction.setTxnRef(txnRef);
            paymentTransaction.setAmount(0L);
            paymentTransaction.setStatus(TransactionStatus.SUCCESS);
            paymentTransaction.setDescription("Kích hoạt gói Subscription miễn phí");
            paymentTransaction.setCompletedAt(LocalDateTime.now());
            PaymentTransaction savedPaymentTransaction = paymentTransactionRepository.save(paymentTransaction);

            SubscriptionResponse response = subscriptionMapper.toDTO(savedSubscription);
            response.setPaymentId(savedPayment.getId());
            response.setPaymentTransactionId(savedPaymentTransaction.getId());
            response.setTxnRef(txnRef);
            response.setPaymentAmount(0L);
            response.setSePayCheckout(null);
            return response;
        } else {
            // Paid plan -> Đơn hàng ở trạng thái PENDING chờ thanh toán SePay
            subscription.setIsActive(false);
            Subscription savedSubscription = subscriptionRepository.save(subscription);

            Payment payment = new Payment();
            payment.setUser(currentUser);
            payment.setSubscription(savedSubscription);
            payment.setType(PaymentType.SUBSCRIPTION);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentMethod(PaymentMethod.SEPAY);
            payment.setAmount(amount);
            payment.setCurrency("VND");
            Payment savedPayment = paymentRepository.save(payment);

            String txnRef = "SUB" + savedSubscription.getId() + getRandomNumber(8);
            String description = "SEVQR " + txnRef;
            PaymentTransaction paymentTransaction = new PaymentTransaction();
            paymentTransaction.setPayment(savedPayment);
            paymentTransaction.setTxnRef(txnRef);
            paymentTransaction.setAmount(amount);
            paymentTransaction.setStatus(TransactionStatus.PENDING);
            paymentTransaction.setDescription(description);
            PaymentTransaction savedPaymentTransaction = paymentTransactionRepository.save(paymentTransaction);

            SePayCheckoutResponse sePayCheckout = paymentService.createSePayPaymentUrl(savedPaymentTransaction);

            SubscriptionResponse response = subscriptionMapper.toDTO(savedSubscription);
            response.setPaymentId(savedPayment.getId());
            response.setPaymentTransactionId(savedPaymentTransaction.getId());
            response.setTxnRef(txnRef);
            response.setPaymentAmount(amount);
            response.setSePayCheckout(sePayCheckout);
            return response;
        }
    }

    @Override
    public SubscriptionResponse getUsersActiveSubscriptions(Long userId) {
        User currentUser = userService.getCurrentUser();

        Subscription subscription = subscriptionRepository
                .findActiveSubscriptionByUserId(currentUser.getId(), LocalDateTime.now())
                .stream().findFirst()
                .orElseThrow(() -> new SubscriptionException(
                        "No active subscription found for user with id: " + currentUser.getId()));

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionResponse cancelSubscription(Long subscriptionId, String reason) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException("Subscription not found with id: " + subscriptionId));

        if (!subscription.getIsActive()) {
            throw new SubscriptionException("Subscription is already cancelled");
        }

        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason != null ? reason : "Cancel by user");

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionResponse activeSubscription(Long subscriptionId, Long paymentId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException("Subscription not found with id: " + subscriptionId));

        if (subscription.getIsActive()) {
            throw new SubscriptionException("Subscription is already active");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new SubscriptionException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new SubscriptionException("Thanh toán cho đăng ký này chưa hoàn tất thành công.");
        }

        subscription.setIsActive(true);
        subscription.setStartDate(LocalDateTime.now());
        subscription.calculateEndDate();

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public List<SubscriptionResponse> getAllSubscriptions(Pageable pageable) {
        List<Subscription> subscriptions = subscriptionRepository.findAll(pageable).getContent();
        return subscriptionMapper.toDTO(subscriptions);
    }

    @Override
    public void deactiveExpiredSubscriptions() {
        List<Subscription> expiredSubscriptions = subscriptionRepository.findExpiredActiveSubscription(LocalDateTime.now());

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
            subscriptionRepository.save(subscription);
        }
    }

    private static String getRandomNumber(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(DIGITS.charAt(SECURE_RANDOM.nextInt(DIGITS.length())));
        }
        return sb.toString();
    }
}
