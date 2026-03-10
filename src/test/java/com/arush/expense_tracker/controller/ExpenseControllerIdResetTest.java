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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ExpenseControllerIdResetTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    private static final String TEST_USER = "idreset-user";

    @BeforeEach
    void cleanDb() {
        expenseRepository.deleteAll();
        appUserRepository.deleteAll();
        appUserRepository.save(new AppUser(TEST_USER, "encoded-password"));
    }

    @Test
    void deleteAllEndpointResetsIdentity() throws Exception {
        createExpense("first", 100);
        mockMvc.perform(delete("/expenses").principal(() -> TEST_USER))
                .andExpect(status().isNoContent());

        long newId = createExpense("after-reset", 200);
        assertThat(newId).isEqualTo(1L);
    }

    @Test
    void deletingLastExpenseResetsIdentity() throws Exception {
        long firstId = createExpense("only-entry", 50);

        mockMvc.perform(delete("/expenses/{id}", firstId).principal(() -> TEST_USER))
                .andExpect(status().isNoContent());

        long newId = createExpense("after-last-delete", 75);
        assertThat(newId).isEqualTo(1L);
    }

    private long createExpense(String title, double amount) throws Exception {
        String payload = """
                {
                  "title": "%s",
                  "amount": %s
                }
                """.formatted(title, amount);

        MvcResult result = mockMvc.perform(post("/expenses")
                        .principal(() -> TEST_USER)
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode body = objectMapper.readTree(Objects.requireNonNull(result.getResponse().getContentAsString()));
        JsonNode idNode = Objects.requireNonNull(body.get("id"), "response id must not be null");
        return idNode.asLong();
    }
}
