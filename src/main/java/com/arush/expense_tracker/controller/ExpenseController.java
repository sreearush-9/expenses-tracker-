package com.arush.expense_tracker.controller;

import com.arush.expense_tracker.exception.ResourceNotFoundException;
import com.arush.expense_tracker.model.AppUser;
import com.arush.expense_tracker.model.Expense;
import com.arush.expense_tracker.repository.AppUserRepository;
import com.arush.expense_tracker.repository.ExpenseRepository;
import com.arush.expense_tracker.service.ExpenseMaintenanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final AppUserRepository appUserRepository;
    private final ExpenseMaintenanceService expenseMaintenanceService;

    public ExpenseController(ExpenseRepository expenseRepository,
                             AppUserRepository appUserRepository,
                             ExpenseMaintenanceService expenseMaintenanceService) {
        this.expenseRepository = expenseRepository;
        this.appUserRepository = appUserRepository;
        this.expenseMaintenanceService = expenseMaintenanceService;
    }

    @GetMapping
    public List<Expense> getAllExpenses(Principal principal) {
        return expenseRepository.findByOwnerUsernameOrderByIdDesc(currentUsername(principal));
    }

    @GetMapping("/{id}")
    public Expense getExpenseById(@PathVariable @NonNull Long id, Principal principal) {
        return expenseRepository.findByIdAndOwnerUsername(id, currentUsername(principal))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Expense addExpense(@Valid @RequestBody @NonNull Expense expense, Principal principal) {
        expense.setOwner(currentUser(principal));
        return expenseRepository.save(expense);
    }

    @PutMapping("/{id}")
    public Expense updateExpense(@PathVariable @NonNull Long id,
                                 @Valid @RequestBody @NonNull Expense request,
                                 Principal principal) {
        Expense expense = expenseRepository.findByIdAndOwnerUsername(id, currentUsername(principal))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        return expenseRepository.save(expense);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(@PathVariable @NonNull Long id, Principal principal) {
        Expense expense = expenseRepository.findByIdAndOwnerUsername(id, currentUsername(principal))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        expenseRepository.delete(expense);
        expenseMaintenanceService.resetIdSequenceIfTableEmpty();
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllExpenses(Principal principal) {
        expenseRepository.deleteAllByOwnerUsername(currentUsername(principal));
        expenseMaintenanceService.resetIdSequenceIfTableEmpty();
    }

    private String currentUsername(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.getName();
    }

    private AppUser currentUser(Principal principal) {
        String username = currentUsername(principal);
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }
}
