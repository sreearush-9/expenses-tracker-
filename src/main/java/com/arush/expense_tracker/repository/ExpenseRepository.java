package com.arush.expense_tracker.repository;


import com.arush.expense_tracker.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByOwnerUsernameOrderByIdDesc(String username);

    Optional<Expense> findByIdAndOwnerUsername(Long id, String username);

    @Modifying
    @Transactional
    @Query("delete from Expense e where e.owner.username = :username")
    int deleteAllByOwnerUsername(@Param("username") String username);
}
