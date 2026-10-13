-- Migration 002: Create tasks table
-- Core task records with creator/assignee relationships and status constraints.

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

-- Indexes for common query patterns
-- (fetching tasks by owner/assignee, filtering by status, sorting by date)
CREATE INDEX idx_tasks_created_by  ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_created_at  ON tasks(created_at DESC);

-- Auto-update updated_at using the trigger function from migration 001
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tasks IS 'Core task entities. Each task has a creator and an optional assignee.';
COMMENT ON COLUMN tasks.status IS 'Allowed values: todo | in_progress | completed';
COMMENT ON COLUMN tasks.priority IS 'Allowed values: low | medium | high';
COMMENT ON COLUMN tasks.completed_at IS 'Set by the application when status changes to completed.';
