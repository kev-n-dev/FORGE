-- FORGE Migration 0002: Messaging System
-- Cloudflare D1 (SQLite)
--
-- Design:
--   A Conversation has exactly two participants.
--   Messages belong to a conversation.
--   Participants track per-user read state and soft-delete.
--   Message content is TEXT only in Phase 2 (attachments come later).
--   No message can be permanently deleted by a user — they can only hide it
--   from their view. This preserves dispute records.

-- ---------------------------------------------------------------------------
-- CONVERSATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY NOT NULL,
  -- Optional context link — helps surface conversations in job/project views
  job_id          TEXT,
  order_id        TEXT,
  -- Cached snippet for conversation list preview
  last_message_preview TEXT,
  last_message_at      TEXT,
  -- Participant count — always 2 for direct messages in Phase 2
  participant_count INTEGER NOT NULL DEFAULT 2,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_conv_last ON conversations(last_message_at DESC);

-- ---------------------------------------------------------------------------
-- CONVERSATION PARTICIPANTS
-- Two rows per conversation (one per user).
-- Tracks unread count and soft-delete per participant.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversation_participants (
  id              TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Display info cached for list rendering (avoids joins on every list load)
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  -- Per-participant state
  unread_count    INTEGER NOT NULL DEFAULT 0,
  last_read_at    TEXT,
  -- Soft delete: user hides conversation from their list without deleting messages
  hidden_at       TEXT,
  joined_at       TEXT NOT NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_cp_user ON conversation_participants(user_id);
CREATE INDEX idx_cp_conv ON conversation_participants(conversation_id);

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Cached sender info to avoid joins in message rendering
  sender_name     TEXT NOT NULL,
  sender_avatar   TEXT,
  -- Content
  body            TEXT NOT NULL,
  -- Optional structured context (e.g. quote request details stored as JSON)
  metadata        TEXT,  -- JSON
  -- Soft delete — sender can retract within 5 minutes
  deleted_at      TEXT,
  -- Audit: edited messages track the last edit time
  edited_at       TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_msg_conv ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_msg_sender ON messages(sender_id);

-- ---------------------------------------------------------------------------
-- Enable messaging feature flag now that the tables exist
-- ---------------------------------------------------------------------------

UPDATE feature_flags SET enabled = 1, updated_at = datetime('now')
WHERE key = 'MESSAGING_ENABLED';
