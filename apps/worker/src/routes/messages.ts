/**
 * Messaging API routes
 *
 * POST /api/messages/conversations              — start a new conversation
 * GET  /api/messages/conversations              — list my conversations
 * GET  /api/messages/conversations/:id          — get thread (messages)
 * POST /api/messages/conversations/:id/messages — send a message
 * POST /api/messages/conversations/:id/read     — mark conversation as read
 * DELETE /api/messages/:messageId               — retract a message (5 min window)
 * GET  /api/messages/unread-count               — total unread badge count
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  findDirectConversation,
  createConversation,
  getConversationsForUser,
  getConversationForUser,
  getOtherParticipant,
  getMessages,
  sendMessage,
  markConversationRead,
  retractMessage,
  getTotalUnreadCount,
  findProfessionalByUserId,
  findUserById,
} from "@forge/database";
import { NotFoundError, AuthorizationError } from "@forge/auth";
import type { Env, HonoVariables } from "../types";
import { ok, err, created } from "../utils/response";
import { requireAuth } from "../middleware/auth";
import { apiRateLimit } from "../middleware/ratelimit";
import type { ConversationSummary, Message } from "@forge/types";

const messages = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

messages.use("*", requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToMessage(row: {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  body: string;
  metadata: string | null;
  deleted_at: string | null;
  edited_at: string | null;
  created_at: string;
}): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    body: row.deleted_at ? "[Message retracted]" : row.body,
    metadata: row.metadata ? (() => { try { return JSON.parse(row.metadata!); } catch { return null; } })() : null,
    deletedAt: row.deleted_at,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  };
}

function rowToConversationSummary(
  row: {
    id: string;
    job_id: string | null;
    last_message_preview: string | null;
    last_message_at: string | null;
    created_at: string;
    my_unread: number;
    other_user_id: string;
    other_display_name: string;
    other_avatar: string | null;
  }
): ConversationSummary {
  return {
    id: row.id,
    otherParticipant: {
      userId: row.other_user_id,
      displayName: row.other_display_name,
      avatarUrl: row.other_avatar,
      unreadCount: row.my_unread,
      lastReadAt: null,
    },
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    unreadCount: row.my_unread,
    jobId: row.job_id,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// POST /api/messages/conversations — start or resume a conversation
// ---------------------------------------------------------------------------
const StartConvSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  body: z.string().min(1).max(4000).trim(),
  metadata: z.record(z.unknown()).optional().nullable(),
  jobId: z.string().uuid().optional().nullable(),
});

messages.post("/conversations", apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = StartConvSchema.safeParse(body);
  if (!parsed.success) {
    return err(c, "VALIDATION_ERROR", "Validation failed", 422);
  }

  const { recipientId, body: msgBody, metadata, jobId } = parsed.data;
  const myUserId = c.get("userId");

  if (recipientId === myUserId) {
    return err(c, "INVALID_RECIPIENT", "You cannot message yourself.", 400);
  }

  // Check recipient exists
  const recipient = await findUserById(c.env.DB, recipientId);
  if (!recipient) throw new NotFoundError("Recipient");

  // Check if conversation already exists — resume it
  const existing = await findDirectConversation(c.env.DB, myUserId, recipientId);
  if (existing) {
    // Send the message into the existing conversation
    const senderProfile = await findProfessionalByUserId(c.env.DB, myUserId);
    const senderName = senderProfile?.display_name ?? c.get("userEmail").split("@")[0] ?? "User";
    const senderAvatar = senderProfile?.avatar_url ?? null;

    const msg = await sendMessage(c.env.DB, {
      conversationId: existing,
      senderId: myUserId,
      senderName,
      senderAvatar,
      body: msgBody,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return ok(c, {
      conversationId: existing,
      message: rowToMessage(msg),
      isNew: false,
    });
  }

  // Resolve sender display name
  const senderProfile = await findProfessionalByUserId(c.env.DB, myUserId);
  const senderName = senderProfile?.display_name ?? c.get("userEmail").split("@")[0] ?? "User";
  const senderAvatar = senderProfile?.avatar_url ?? null;

  // Resolve recipient display name
  const recipientProfile = await findProfessionalByUserId(c.env.DB, recipientId);
  const recipientName = recipientProfile?.display_name ?? recipient.email.split("@")[0] ?? "User";
  const recipientAvatar = recipientProfile?.avatar_url ?? null;

  const { conversationId, messageId } = await createConversation(c.env.DB, {
    senderUserId: myUserId,
    senderName,
    senderAvatar,
    recipientUserId: recipientId,
    recipientName,
    recipientAvatar,
    body: msgBody,
    metadata: metadata ? JSON.stringify(metadata) : null,
    jobId: jobId ?? null,
  });

  const msgs = await getMessages(c.env.DB, conversationId, null);
  const openingMsg = msgs.find((m) => m.id === messageId) ?? msgs[0];

  return created(c, {
    conversationId,
    message: openingMsg ? rowToMessage(openingMsg) : null,
    isNew: true,
  });
});

// ---------------------------------------------------------------------------
// GET /api/messages/conversations — list my conversations
// ---------------------------------------------------------------------------
messages.get("/conversations", async (c) => {
  const rows = await getConversationsForUser(c.env.DB, c.get("userId"));
  return ok(c, rows.map(rowToConversationSummary));
});

// ---------------------------------------------------------------------------
// GET /api/messages/conversations/:id — get thread
// ---------------------------------------------------------------------------
messages.get("/conversations/:id", async (c) => {
  const conversationId = c.req.param("id");
  const myUserId = c.get("userId");

  const conv = await getConversationForUser(c.env.DB, conversationId, myUserId);
  if (!conv) throw new NotFoundError("Conversation");

  const cursor = c.req.query("cursor") ?? null;
  const rows = await getMessages(c.env.DB, conversationId, cursor);

  const other = await getOtherParticipant(c.env.DB, conversationId, myUserId);

  const summary: ConversationSummary = {
    id: conv.id,
    otherParticipant: {
      userId: other?.user_id ?? "",
      displayName: other?.display_name ?? "Unknown",
      avatarUrl: other?.avatar_url ?? null,
      unreadCount: conv.my_unread,
      lastReadAt: other?.last_read_at ?? null,
    },
    lastMessagePreview: conv.last_message_preview,
    lastMessageAt: conv.last_message_at,
    unreadCount: conv.my_unread,
    jobId: conv.job_id,
    createdAt: conv.created_at,
  };

  // Mark as read on open
  await markConversationRead(c.env.DB, conversationId, myUserId);

  const msgList = rows.map(rowToMessage).reverse(); // Chronological order
  const nextCursor = rows.length === 40 ? rows[rows.length - 1]?.created_at ?? null : null;

  return ok(c, {
    conversation: summary,
    messages: msgList,
    hasMore: rows.length === 40,
    nextCursor,
  });
});

// ---------------------------------------------------------------------------
// POST /api/messages/conversations/:id/messages — send a message
// ---------------------------------------------------------------------------
const SendMsgSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(4000).trim(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

messages.post("/conversations/:id/messages", apiRateLimit, async (c) => {
  const conversationId = c.req.param("id");
  const myUserId = c.get("userId");

  const conv = await getConversationForUser(c.env.DB, conversationId, myUserId);
  if (!conv) throw new NotFoundError("Conversation");

  const body = await c.req.json().catch(() => null);
  const parsed = SendMsgSchema.safeParse(body);
  if (!parsed.success) {
    return err(c, "VALIDATION_ERROR", "Validation failed", 422);
  }

  const senderProfile = await findProfessionalByUserId(c.env.DB, myUserId);
  const senderName = senderProfile?.display_name ?? c.get("userEmail").split("@")[0] ?? "User";
  const senderAvatar = senderProfile?.avatar_url ?? null;

  const msg = await sendMessage(c.env.DB, {
    conversationId,
    senderId: myUserId,
    senderName,
    senderAvatar,
    body: parsed.data.body,
    metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null,
  });

  return created(c, rowToMessage(msg));
});

// ---------------------------------------------------------------------------
// POST /api/messages/conversations/:id/read — mark as read
// ---------------------------------------------------------------------------
messages.post("/conversations/:id/read", async (c) => {
  const conversationId = c.req.param("id");
  const myUserId = c.get("userId");

  const conv = await getConversationForUser(c.env.DB, conversationId, myUserId);
  if (!conv) throw new NotFoundError("Conversation");

  await markConversationRead(c.env.DB, conversationId, myUserId);
  return ok(c, { message: "Marked as read." });
});

// ---------------------------------------------------------------------------
// DELETE /api/messages/:messageId — retract (soft-delete, 5 min window)
// ---------------------------------------------------------------------------
messages.delete("/:messageId", async (c) => {
  const retracted = await retractMessage(
    c.env.DB,
    c.req.param("messageId"),
    c.get("userId")
  );
  if (!retracted) {
    return err(
      c,
      "RETRACT_FAILED",
      "Messages can only be retracted within 5 minutes of sending.",
      409
    );
  }
  return ok(c, { message: "Message retracted." });
});

// ---------------------------------------------------------------------------
// GET /api/messages/unread-count — total unread badge count
// ---------------------------------------------------------------------------
messages.get("/unread-count", async (c) => {
  const count = await getTotalUnreadCount(c.env.DB, c.get("userId"));
  return ok(c, { count });
});

export { messages as messagesRouter };
