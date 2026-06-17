package com.thanh.librarymanagementsystem.model;

import com.thanh.librarymanagementsystem.enums.CopyStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * Thực thể vật lý đại diện cho một cuốn sách cụ thể trên kệ.
 * Mỗi bản sao gắn với một Book (tựa sách trừu tượng) và có mã vạch cá biệt
 * riêng.
 */
@Entity
@Table(name = "book_copies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookCopy extends BaseEntity {

    /**
     * Tựa sách (thực thể trừu tượng) mà bản sao này thuộc về.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    /**
     * Mã vạch cá biệt duy nhất của bản sao (ví dụ: "LIB-2024-001").
     * Mã này được in trên nhãn dán vật lý của cuốn sách trên kệ.
     */
    @Column(name = "barcode", nullable = false, unique = true, length = 100)
    private String barcode;

    /**
     * Trạng thái hiện tại của bản sao.
     * Mặc định là AVAILABLE khi bản sao mới được nhập vào thư viện.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(50)")
    private CopyStatus status = CopyStatus.AVAILABLE;

    @Version
    @Column(name = "version")
    private Long version;
}
