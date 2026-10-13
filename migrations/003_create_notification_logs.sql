-- Migration 003: Create notification_logs table
-- Audit log of email notifications (success/failure) for task events.

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
    message_id        TEXT,           -- Gmail message ID returned on success
    error_message     TEXT,           -- Error detail stored on failure
    sent_at           TIMESTAMPTZ,    -- NULL on failure
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_task_id ON notification_logs(task_id);
CREATE INDEX idx_notif_status  ON notification_logs(status);

COMMENT ON TABLE notification_logs IS 'Audit log of all email notification attempts (success and failure).';
COMMENT ON COLUMN notification_logs.message_id IS 'Gmail API message ID returned on successful send.';
COMMENT ON COLUMN notification_logs.error_message IS 'Error detail when status = FAILED. Never exposed to frontend.';
