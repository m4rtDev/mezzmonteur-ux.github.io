-- Migration 0001: Initial schema for visits tracking with 365-day retention support
CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    page TEXT NOT NULL,
    ip TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Inconnu',
    country TEXT NOT NULL DEFAULT 'Inconnu',
    browser TEXT NOT NULL DEFAULT 'Autre',
    device TEXT NOT NULL DEFAULT 'Desktop',
    referrer TEXT NOT NULL DEFAULT 'Direct'
);

-- Index for efficient retention cleanup (older than 365 days) and range queries
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);

-- Index for visitor analytics
CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id);
