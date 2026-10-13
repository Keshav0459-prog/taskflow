-- Collaboration comments for tasks. Access is enforced by the authenticated API.
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_created
    ON task_comments(task_id, created_at ASC);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
-- The backend uses the service role after verifying the user's task access.
