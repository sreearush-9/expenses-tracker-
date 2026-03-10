package com.arush.expense_tracker.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Locale;

@Service
public class ExpenseMaintenanceService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public ExpenseMaintenanceService(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    public void deleteAllAndResetIds() {
        if (isMySqlOrH2()) {
            jdbcTemplate.execute("TRUNCATE TABLE expense");
            return;
        }

        jdbcTemplate.update("DELETE FROM expense");
        resetIdSequenceIfTableEmpty();
    }

    public void resetIdSequenceIfTableEmpty() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM expense", Long.class);
        if (count == null || count > 0) {
            return;
        }

        String db = databaseProductName();
        if (db.contains("h2")) {
            jdbcTemplate.execute("ALTER TABLE expense ALTER COLUMN id RESTART WITH 1");
            return;
        }
        if (db.contains("mysql")) {
            jdbcTemplate.execute("ALTER TABLE expense AUTO_INCREMENT = 1");
        }
    }

    private boolean isMySqlOrH2() {
        String db = databaseProductName();
        return db.contains("h2") || db.contains("mysql");
    }

    private String databaseProductName() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT);
        } catch (SQLException ex) {
            throw new IllegalStateException("Unable to detect database type", ex);
        }
    }
}
