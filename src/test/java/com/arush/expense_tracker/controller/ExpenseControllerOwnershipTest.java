package com.arush.expense_tracker.controller;

import com.arush.expense_tracker.model.AppUser;
import com.arush.expense_tracker.repository.AppUserRepository;
import com.arush.expense_tracker.repository.ExpenseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ExpenseControllerOwnershipTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @BeforeEach
    void cleanDb() {
        expenseRepository.deleteAll();
        appUserRepository.deleteAll();
        appUserRepository.save(new AppUser("alice", "encoded-alice"));
        appUserRepository.save(new AppUser("bob", "encoded-bob"));
    }

    @Test
    void eachUserSeesOnlyOwnExpenses() throws Exception {
        long aliceExpenseId = createExpense("alice", "alice-rent", 1000);
        createExpense("bob", "bob-fuel", 250);

        MvcResult aliceList = mockMvc.perform(get("/expenses").principal(() -> "alice"))
                .andExpect(status().isOk())
                .andReturn();
        String aliceBody = aliceList.getResponse().getContentAsString();
        assertThat(aliceBody).contains("alice-rent").doesNotContain("bob-fuel");

        mockMvc.perform(get("/expenses/{id}", aliceExpenseId).principal(() -> "bob"))
                .andExpect(status().isNotFound());
    }

    private long createExpense(String username, String title, double amount) throws Exception {
        String payload = """
                {
                  "title": "%s",
                  "amount": %s
                }
                """.formatted(title, amount);

        MvcResult result = mockMvc.perform(post("/expenses")
                        .principal(() -> username)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode body = objectMapper.readTree(Objects.requireNonNull(result.getResponse().getContentAsString()));
        JsonNode idNode = Objects.requireNonNull(body.get("id"), "response id must not be null");
        return idNode.asLong();
    }
}
