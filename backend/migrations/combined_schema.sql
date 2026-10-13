-- ============================================================
-- TaskFlow Database Schema (Run in Supabase SQL Editor)
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY,         -- Matches Supabase auth.users.id
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL CHECK (char_length(title) <= 255),
    description  TEXT,
    status       TEXT NOT NULL DEFAULT 'todo'
                   CONSTRAINT tasks_status_check
                   CHECK (status IN ('todo', 'in_progress', 'completed')),
    priority     TEXT NOT NULL DEFAULT 'medium'
                   CONSTRAINT tasks_priority_check
                   CHECK (priority IN ('low', 'medium', 'high')),
    created_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_to  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date     DATE,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by  ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at  ON tasks(created_at DESC);

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. NOTIFICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS notification_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id           UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    recipient_email   TEXT NOT NULL,
    notification_type TEXT NOT NULL
                        CONSTRAINT notif_type_check
                        CHECK (notification_type IN ('TASK_CREATED', 'TASK_COMPLETED')),
    status            TEXT NOT NULL
                        CONSTRAINT notif_status_check
                        CHECK (status IN ('SENT', 'FAILED')),
    message_id        TEXT,
    error_message     TEXT,
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_task_id ON notification_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_notif_status  ON notification_logs(status);
