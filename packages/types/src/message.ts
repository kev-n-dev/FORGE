// ---------------------------------------------------------------------------
// Messaging types — Phase 2
// ---------------------------------------------------------------------------

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  unreadCount: number;
  lastReadAt: string | null;
}

/** Summary shown in the conversation list sidebar */
export interface ConversationSummary {
  id: string;
  /** The other participant (from the current user's perspective) */
  otherParticipant: ConversationParticipant;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  /** Optional job context */
  jobId: string | null;
  createdAt: string;
}

/** Full message object */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  body: string;
  /** Structured metadata (e.g. quote request) */
  metadata: MessageMetadata | null;
  deletedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

/** Optional structured payload attached to a message */
export interface MessageMetadata {
  type: "text" | "quote_request" | "job_link";
  /** For type = "quote_request" */
  quoteRequest?: {
    description: string;
    budget?: string;
    timeframe?: string;
  };
  /** For type = "job_link" */
  jobId?: string;
  jobTitle?: string;
}

/** Full conversation thread — summary + paginated messages */
export interface ConversationThread {
  conversation: ConversationSummary;
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// API request shapes
// ---------------------------------------------------------------------------

export interface StartConversationRequest {
  /** The other user to start a conversation with */
  recipientId: string;
  /** Opening message */
  body: string;
  metadata?: MessageMetadata;
  /** Optional job context */
  jobId?: string;
}

export interface SendMessageRequest {
  body: string;
  metadata?: MessageMetadata;
}
