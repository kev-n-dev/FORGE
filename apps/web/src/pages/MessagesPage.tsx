import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { ConversationSummary, ConversationThread, Message } from "@forge/types";
import {
  MessageSquare, Send, ArrowLeft, MoreVertical, Trash2, AlertCircle, Check,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Conversation List item
// ---------------------------------------------------------------------------
function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-charcoal-800 transition-colors",
        isActive ? "bg-charcoal-800" : "hover:bg-charcoal-800/60"
      )}
    >
      <div className="relative shrink-0">
        <Avatar
          src={conv.otherParticipant.avatarUrl}
          name={conv.otherParticipant.displayName}
          size="md"
        />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-copper-500 text-white text-xs flex items-center justify-center font-bold">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <p className={cn("text-sm font-medium truncate", conv.unreadCount > 0 ? "text-charcoal-50" : "text-charcoal-200")}>
            {conv.otherParticipant.displayName}
          </p>
          {conv.lastMessageAt && (
            <span className="text-xs text-charcoal-500 shrink-0">{formatTime(conv.lastMessageAt)}</span>
          )}
        </div>
        {conv.lastMessagePreview && (
          <p className={cn("text-xs truncate mt-0.5", conv.unreadCount > 0 ? "text-charcoal-300 font-medium" : "text-charcoal-500")}>
            {conv.lastMessagePreview}
          </p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({
  msg,
  isMine,
  onRetract,
}: {
  msg: Message;
  isMine: boolean;
  onRetract: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const canRetract =
    isMine &&
    !msg.deletedAt &&
    Date.now() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000;

  return (
    <div className={cn("flex gap-2 group", isMine ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative",
          msg.deletedAt
            ? "bg-charcoal-800 text-charcoal-500 italic"
            : isMine
              ? "bg-copper-700 text-white rounded-tr-sm"
              : "bg-charcoal-800 text-charcoal-100 rounded-tl-sm"
        )}
      >
        {msg.body}
        <span className={cn("text-xs mt-1 flex items-center gap-1", isMine ? "text-copper-200 justify-end" : "text-charcoal-500")}>
          {formatTime(msg.createdAt)}
          {msg.editedAt && <span>(edited)</span>}
        </span>
      </div>

      {/* Retract menu */}
      {canRetract && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center relative">
          <button
            type="button"
            onClick={() => setShowMenu((s) => !s)}
            className="p-1 rounded text-charcoal-500 hover:text-charcoal-300 hover:bg-charcoal-800 transition-colors"
            aria-label="Message options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true" />
              <div className="absolute z-20 mt-1 right-0 forge-card p-1 w-36 shadow-lg">
                <button
                  type="button"
                  onClick={() => { onRetract(msg.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-charcoal-800 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Retract
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message thread panel
// ---------------------------------------------------------------------------
function ThreadPanel({
  conversationId,
  myUserId,
  onBack,
}: {
  conversationId: string;
  myUserId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", conversationId],
    queryFn: () => api.get<ConversationThread>(`/messages/conversations/${conversationId}`),
    refetchInterval: 8_000, // Poll every 8s for new messages
  });

  // Scroll to bottom when thread loads or new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  // Invalidate conversation list to update unread badge
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [queryClient, conversationId]);

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      api.post<Message>(`/messages/conversations/${conversationId}/messages`, { body }),
    onSuccess: (newMsg) => {
      queryClient.setQueryData<ConversationThread>(
        ["thread", conversationId],
        (old) => old
          ? { ...old, messages: [...old.messages, newMsg] }
          : old
      );
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSendError("");
    },
    onError: (e) => {
      setSendError(e instanceof ApiClientError ? e.message : "Failed to send. Try again.");
    },
  });

  const retractMutation = useMutation({
    mutationFn: (messageId: string) => api.delete(`/messages/${messageId}`),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData<ConversationThread>(
        ["thread", conversationId],
        (old) => old
          ? {
              ...old,
              messages: old.messages.map((m) =>
                m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), body: "[Message retracted]" } : m
              ),
            }
          : old
      );
    },
  });

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
    setInput("");
    inputRef.current?.focus();
  }, [input, sendMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center text-charcoal-400 text-sm">
        Conversation not found.
      </div>
    );
  }

  const other = thread.conversation.otherParticipant;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-charcoal-800 bg-charcoal-900 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <Avatar src={other.avatarUrl} name={other.displayName} size="sm" />
        <div>
          <p className="font-medium text-charcoal-100">{other.displayName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.length === 0 ? (
          <div className="text-center py-12 text-charcoal-500 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          thread.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === myUserId}
              onRetract={(id) => retractMutation.mutate(id)}
            />
          ))
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-charcoal-800 bg-charcoal-900 shrink-0">
        {sendError && (
          <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {sendError}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            maxLength={4000}
            className="forge-input flex-1 resize-none min-h-[44px] max-h-40 overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
            }}
            aria-label="Message input"
          />
          <Button
            onClick={handleSend}
            loading={sendMutation.isPending}
            disabled={!input.trim()}
            className="shrink-0 px-3 py-2.5"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-xs text-charcoal-600 mt-1.5">
          Messages are private. You can retract a message within 5 minutes of sending.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MessagesPage
// ---------------------------------------------------------------------------
export function MessagesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { conversation?: string };
  const [activeConvId, setActiveConvId] = useState<string | null>(
    search.conversation ?? null
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/messages" } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<ConversationSummary[]>("/messages/conversations"),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    // Update URL without hard navigation
    const url = new URL(window.location.href);
    url.searchParams.set("conversation", id);
    window.history.replaceState({}, "", url.toString());
  };

  const handleBack = () => {
    setActiveConvId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("conversation");
    window.history.replaceState({}, "", url.toString());
  };

  if (authLoading || !user) {
    return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-[calc(100vh-10rem)] min-h-96 forge-card overflow-hidden flex">
        {/* ----------------------------------------------------------------
            Conversation List — always visible on lg, hidden on mobile when
            a thread is open
        ---------------------------------------------------------------- */}
        <aside
          className={cn(
            "w-full lg:w-80 shrink-0 border-r border-charcoal-800 flex flex-col",
            activeConvId ? "hidden lg:flex" : "flex"
          )}
          aria-label="Conversations"
        >
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-charcoal-800 shrink-0">
            <h1 className="text-lg font-semibold text-charcoal-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-copper-500" aria-hidden="true" />
              Messages
            </h1>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="px-4 py-12 text-center space-y-4">
                <MessageSquare className="h-10 w-10 text-charcoal-700 mx-auto" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-charcoal-400">No conversations yet</p>
                  <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                    Visit a professional's profile and click{" "}
                    <span className="text-charcoal-300">Contact</span> to start a conversation.
                  </p>
                </div>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  onClick={() => handleSelectConv(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ----------------------------------------------------------------
            Thread panel — hidden on mobile when no conversation selected
        ---------------------------------------------------------------- */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            !activeConvId ? "hidden lg:flex" : "flex"
          )}
        >
          {activeConvId ? (
            <ThreadPanel
              key={activeConvId}
              conversationId={activeConvId}
              myUserId={user.id}
              onBack={handleBack}
            />
          ) : (
            /* Empty state — no conversation selected (desktop only) */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-charcoal-800 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-charcoal-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-charcoal-300">Select a conversation</p>
                <p className="text-sm text-charcoal-500 mt-1">
                  Or start one by contacting a professional.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
