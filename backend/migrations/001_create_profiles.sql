-- Migration 001: Create profiles table
-- Stores user profile data synchronized from auth.users (1:1 with auth.users.id).

CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY,         -- Matches Supabase auth.users.id
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically update `updated_at` on any row change.
-- Requires the pg_moddatetime extension or a trigger function.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE profiles IS 'User profile data synchronized from Supabase Auth after Google OAuth login.';
COMMENT ON COLUMN profiles.id IS 'Must match the corresponding Supabase auth.users.id.';
