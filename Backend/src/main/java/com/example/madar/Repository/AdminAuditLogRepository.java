package com.example.madar.Repository;


import com.example.madar.Model.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Integer> {

    Page<AdminAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}