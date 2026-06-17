package com.thanh.librarymanagementsystem.listener;
 
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import com.thanh.librarymanagementsystem.service.BookLoanService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class RedisKeyExpirationListener extends KeyExpirationEventMessageListener {
    private final BookLoanService bookLoanService;

    public RedisKeyExpirationListener(
            RedisMessageListenerContainer listenerContainer,
            BookLoanService bookLoanService
    ) {
        super(listenerContainer);
        this.bookLoanService = bookLoanService;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        log.info("[Redis Expiration Listener] Key expired event received for key: {}", expiredKey);

        // Cấu trúc key: loan:hold:{loanId}
        if (expiredKey != null && expiredKey.startsWith("loan:hold:")) {
            try {
                Long loanId = Long.parseLong(expiredKey.split(":")[2]);
                log.info("[Redis Expiration Listener] Processing expiration for loanId: {}", loanId);
                bookLoanService.handleExpiredLoan(loanId);
            } catch (Exception e) {
                log.error("[Redis Expiration Listener] Error handling expired key " + expiredKey, e);
            }
        }
    }
}
