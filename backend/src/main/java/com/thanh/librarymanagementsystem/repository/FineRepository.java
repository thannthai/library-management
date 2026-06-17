package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {

    List<Fine> findByBookLoanId(Long bookLoanId);

    /**
     * Tìm phiếu phạt của một đơn mượn theo trạng thái.
     * Dùng trong Scheduler: kiểm tra xem đơn mượn quá hạn đã có Fine PENDING chưa
     * để quyết định tạo mới hay cộng dồn thêm tiền phạt.
     */
    Optional<Fine> findByBookLoanIdAndStatus(Long bookLoanId, FineStatus status);



    @Query("SELECT f FROM Fine f WHERE f.user.id = :userId AND " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:type IS NULL OR f.type = :type)")
    List<Fine> findByUserIdAndFilters(
            @Param("userId") Long userId,
            @Param("status") FineStatus status,
            @Param("type") FineType type);

    @Query("SELECT f FROM Fine f WHERE " +
           "(:userId IS NULL OR f.user.id = :userId) AND " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:type IS NULL OR f.type = :type)")
    Page<Fine> findAllWithFilters(
            @Param("userId") Long userId,
            @Param("status") FineStatus status,
            @Param("type") FineType type,
            Pageable pageable);
}
