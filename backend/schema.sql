-- Supabase / PostgreSQL schema for PlainMD
-- Lives in the `plainmd` schema of the shared "Simple Tech MVPs" project (SUPABASE_SCHEMA env var).
-- Run the whole file in the Supabase SQL Editor (creates the schema and grants).
-- The backend uses the service_role key; anon/authenticated have no grants on this schema,
-- so RLS stays enabled with no policies.

create schema if not exists plainmd;
set search_path = plainmd;
grant usage on schema plainmd to service_role;
revoke all on schema plainmd from anon, authenticated;

-- ========================================
-- Users
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    password_hash TEXT,
    auth_provider TEXT DEFAULT 'email',
    onboarded BOOLEAN DEFAULT FALSE,
    is_guest BOOLEAN DEFAULT FALSE,
    guest_uploads_count INT DEFAULT 0,
    guest_questions_count INT DEFAULT 0,
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Sessions
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Medical Documents
-- ========================================
CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_url TEXT,
    file_size INT,
    category TEXT DEFAULT 'uncategorized',
    record_type TEXT,
    extracted_text TEXT,
    structured_data JSONB DEFAULT '{}',
    summary TEXT,
    record_date TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Conversations
-- ========================================
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(document_id) ON DELETE SET NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Messages
-- ========================================
CREATE TABLE IF NOT EXISTS messages (
    message_id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id TEXT,
    role TEXT NOT NULL,
    content JSONB,
    citations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_user_category ON documents(user_id, category);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_document_id ON conversations(document_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

grant all on all tables in schema plainmd to service_role;
grant all on all sequences in schema plainmd to service_role;
grant all on all routines in schema plainmd to service_role;
alter default privileges in schema plainmd grant all on tables to service_role;
alter default privileges in schema plainmd grant all on sequences to service_role;
-- PostgREST must expose the schema: Dashboard > Settings > API > Exposed schemas, add plainmd.
