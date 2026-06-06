package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender javaMailSender;

    @Override
    public void sendEmail(String to, String subject, String body) {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, "utf-8");

        try {
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);
            mimeMessageHelper.setText(body, true);

            javaMailSender.send(mimeMessage);
        } catch (MailException e) {
            throw new MailSendException("Failed to send email " + e.getMessage());
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to create email message " + e.getMessage());
        }
    }
}
