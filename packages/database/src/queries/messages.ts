import { dbAll, dbFirst, dbRun, newId, now, type DB } from "../utils";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export interface ConversationRow {
  id: string;
  job_id: string | null;
  order_id: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipantRow {
  id: string;
  conversation_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  unread_count: number;
  last_read_at: string | null;
  hidden_at: string | null;
  joined_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  body: string;
  metadata: string | null; // JSON
  deleted_at: string | null;
  edited_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Conversation queries
// ---------------------------------------------------------------------------

/**
 * Find an existing direct conversation between two users.
 * Returns the conversation ID if found.
 */
export async function findDirectConversation(
  db: DB,
  userAId: string,
  userBId: string
): Promise<string | null> {
  const row = await dbFirst<{ id: string }>(
    db,
    `SELECT c.id
     FROM conversations c
     JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ?
     JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ?
     WHERE c.participant_count = 2
     LIMIT 1`,
    userAId,
    userBId
  );
  return row?.id ?? null;
}

/**
 * Create a new direct conversation between two users and send the opening message.
 * Returns the new conversation ID.
 */
export async function createConversation(
  db: DB,
  params: {
    senderUserId: string;
    senderName: string;
    senderAvatar: string | null;
    recipientUserId: string;
    recipientName: string;
    recipientAvatar: string | null;
    body: string;
    metadata?: string | null;
    jobId?: string | null;
  }
): Promise<{ conversationId: string; messageId: string }> {
  const conversationId = newId();
  const messageId = newId();
  const ts = now();
  const preview = params.body.slice(0, 100);

  // Create conversation
  await dbRun(
    db,
    `INSERT INTO conversations (id, job_id, last_message_preview, last_message_at, participant_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, 2, ?, ?)`,
    conversationId,
    params.jobId ?? null,
    preview,
    ts,
    ts,
    ts
  );

  // Add sender participant
  await dbRun(
    db,
    `INSERT INTO conversation_participants (id, conversation_id, user_id, display_name, avatar_url, unread_count, joined_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    newId(),
    conversationId,
    params.senderUserId,
    params.senderName,
    params.senderAvatar,
    ts
  );

  // Add recipient participant (unread = 1 for the opening message)
  await dbRun(
    db,
    `INSERT INTO conversation_participants (id, conversation_id, user_id, display_name, avatar_url, unread_count, joined_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    newId(),
    conversationId,
    params.recipientUserId,
    params.recipientName,
    params.recipientAvatar,
    ts
  );

  // Insert opening message
  await dbRun(
    db,
    `INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_avatar, body, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    messageId,
    conversationId,
    params.senderUserId,
    params.senderName,
    params.senderAvatar,
    params.body,
    params.metadata ?? null,
    ts
  );

  return { conversationId, messageId };
}

/**
 * Get all conversations for a user, sorted by most recent message.
 * Excludes conversations the user has hidden.
 */
export async function getConversationsForUser(
  db: DB,
  userId: string
): Promise<Array<ConversationRow & { other_user_id: string; other_display_name: string; other_avatar: string | null; my_unread: number }>> {
  return dbAll(
    db,
    `SELECT
       c.*,
       other.user_id    AS other_user_id,
       other.display_name AS other_display_name,
       other.avatar_url   AS other_avatar,
       me.unread_count    AS my_unread
     FROM conversations c
     JOIN conversation_participants me    ON me.conversation_id    = c.id AND me.user_id = ?
     JOIN conversation_participants other ON other.conversation_id = c.id AND other.user_id != ?
     WHERE me.hidden_at IS NULL
     ORDER BY c.last_message_at DESC NULLS LAST`,
    userId,
    userId
  );
}

/** Get a single conversation row, only if the user is a participant. */
export async function getConversationForUser(
  db: DB,
  conversationId: string,
  userId: string
): Promise<(ConversationRow & { my_unread: number }) | null> {
  return dbFirst(
    db,
    `SELECT c.*, cp.unread_count AS my_unread
     FROM conversations c
     JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ?
     WHERE c.id = ?`,
    userId,
    conversationId
  );
}

/**
 * Get the other participant in a conversation from the current user's perspective.
 */
export async function getOtherParticipant(
  db: DB,
  conversationId: string,
  myUserId: string
): Promise<ConversationParticipantRow | null> {
  return dbFirst<ConversationParticipantRow>(
    db,
    `SELECT * FROM conversation_participants
     WHERE conversation_id = ? AND user_id != ?`,
    conversationId,
    myUserId
  );
}

// ---------------------------------------------------------------------------
// Message queries
// ---------------------------------------------------------------------------

const PAGE_SIZE = 40;

/**
 * Get messages for a conversation, newest-first with cursor-based pagination.
 * Pass cursor = null to get the most recent page.
 */
export async function getMessages(
  db: DB,
  conversationId: string,
  cursor: string | null
): Promise<MessageRow[]> {
  if (cursor) {
    // Cursor is a message created_at ISO string — return messages older than it
    return dbAll<MessageRow>(
      db,
      `SELECT * FROM messages
       WHERE conversation_id = ? AND created_at < ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ?`,
      conversationId,
      cursor,
      PAGE_SIZE
    );
  }
  return dbAll<MessageRow>(
    db,
    `SELECT * FROM messages
     WHERE conversation_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    conversationId,
    PAGE_SIZE
  );
}

/** Send a message into an existing conversation. */
export async function sendMessage(
  db: DB,
  params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    body: string;
    metadata?: string | null;
  }
): Promise<MessageRow> {
  const id = newId();
  const ts = now();
  const preview = params.body.slice(0, 100);

  await dbRun(
    db,
    `INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_avatar, body, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    params.conversationId,
    params.senderId,
    params.senderName,
    params.senderAvatar,
    params.body,
    params.metadata ?? null,
    ts
  );

  // Update conversation preview and bump recipient unread count
  await dbRun(
    db,
    `UPDATE conversations SET last_message_preview = ?, last_message_at = ?, updated_at = ? WHERE id = ?`,
    preview,
    ts,
    ts,
    params.conversationId
  );

  await dbRun(
    db,
    `UPDATE conversation_participants
     SET unread_count = unread_count + 1
     WHERE conversation_id = ? AND user_id != ?`,
    params.conversationId,
    params.senderId
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await dbFirst<MessageRow>(db, "SELECT * FROM messages WHERE id = ?", id))!;
}

/** Mark all messages in a conversation as read for a user. */
export async function markConversationRead(
  db: DB,
  conversationId: string,
  userId: string
): Promise<void> {
  await dbRun(
    db,
    `UPDATE conversation_participants
     SET unread_count = 0, last_read_at = ?
     WHERE conversation_id = ? AND user_id = ?`,
    now(),
    conversationId,
    userId
  );
}

/**
 * Soft-delete a message (sender only, within 5 minutes).
 * Returns true if deleted, false if not eligible.
 */
export async function retractMessage(
  db: DB,
  messageId: string,
  senderId: string
): Promise<boolean> {
  const msg = await dbFirst<{ id: string; sender_id: string; created_at: string }>(
    db,
    "SELECT id, sender_id, created_at FROM messages WHERE id = ?",
    messageId
  );
  if (!msg || msg.sender_id !== senderId) return false;

  const ageMs = Date.now() - new Date(msg.created_at).getTime();
  if (ageMs > 5 * 60 * 1000) return false; // 5 minute window

  await dbRun(db, "UPDATE messages SET deleted_at = ? WHERE id = ?", now(), messageId);
  return true;
}

/** Get total unread message count for a user across all conversations. */
export async function getTotalUnreadCount(db: DB, userId: string): Promise<number> {
  const row = await dbFirst<{ total: number }>(
    db,
    `SELECT SUM(unread_count) as total FROM conversation_participants WHERE user_id = ? AND hidden_at IS NULL`,
    userId
  );
  return row?.total ?? 0;
}
