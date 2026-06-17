package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.enums.CopyStatus;
import com.thanh.librarymanagementsystem.model.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {

    /** Tìm bản sao theo mã vạch cá biệt (dùng cho luồng check-in quét barcode) */
    Optional<BookCopy> findByBarcode(String barcode);

    /** Lấy tất cả bản sao của một tựa sách */
    List<BookCopy> findByBookId(Long bookId);

    /** Đếm số bản sao AVAILABLE của một tựa sách (dùng cho kiểm tra tồn kho) */
    long countByBookIdAndStatus(Long bookId, CopyStatus status);

    List<BookCopy> findByBookIdAndStatus(Long bookId, CopyStatus status);
}
