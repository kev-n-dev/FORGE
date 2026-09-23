/**
 * Contact / Request Quote modal — sends a real opening message to a professional.
 * Starting a conversation navigates to /messages?conversation=<id>.
 */
import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { X, MessageSquare, FileText, ArrowRight, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ContactModalProps {
  professionalName: string;
  professionalSlug: string;
  /** The professional's user ID — needed to address the message */
  professionalUserId: string;
  mode: "contact" | "quote";
  onClose: () => void;
}

const QUOTE_TEMPLATE = `Hi, I'd like to request a quote for a project.

Project description:

Timeline:

Budget:`;

export function ContactModal({
  professionalName,
  professionalSlug,
  professionalUserId,
  mode,
  onClose,
}: ContactModalProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState(mode === "quote" ? QUOTE_TEMPLATE : "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const result = await api.post<{ conversationId: string; isNew: boolean }>(
        "/messages/conversations",
        {
          recipientId: professionalUserId,
          body: message.trim(),
          metadata: mode === "quote" ? { type: "quote_request" } : { type: "text" },
        }
      );
      onClose();
      await navigate({
        to: "/messages",
        search: { conversation: result.conversationId },
      });
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to send message.");
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative guild-card w-full max-w-lg p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="contact-modal-title" className="text-lg font-semibold text-charcoal-100">
              {mode === "quote" ? "Request a Quote" : `Message ${professionalName}`}
            </h2>
            <p className="text-sm text-charcoal-400 mt-0.5">{professionalName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* Not logged in */
          <div className="space-y-4">
            <p className="text-sm text-charcoal-400 leading-relaxed">
              Create a free account to message{" "}
              <span className="text-charcoal-200 font-medium">{professionalName}</span>.
              All messages are kept in your inbox.
            </p>
            <div className="space-y-2">
              <Link
                to="/register"
                className="guild-btn-primary w-full inline-flex justify-center"
                onClick={onClose}
              >
                Create free account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                search={{ redirect: `/people/${professionalSlug}` }}
                className="guild-btn-secondary w-full inline-flex justify-center"
                onClick={onClose}
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Logged in — compose message */
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Mode indicator */}
            <div className={cn(
              "flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border",
              mode === "quote"
                ? "bg-copper-900/20 border-copper-800 text-copper-300"
                : "bg-charcoal-800 border-charcoal-700 text-charcoal-400"
            )}>
              {mode === "quote"
                ? <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                : <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {mode === "quote"
                ? "Quote request — fill in your project details below"
                : "Direct message"}
            </div>

            {/* Message textarea */}
            <div>
              <label htmlFor="contact-message" className="guild-label">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={mode === "quote" ? 8 : 4}
                maxLength={4000}
                placeholder={mode === "contact" ? `Say hello to ${professionalName}…` : undefined}
                className="guild-input resize-none mt-1.5 w-full"
                autoFocus
              />
              <p className="text-xs text-charcoal-500 mt-1 text-right">
                {message.length}/4000
              </p>
            </div>

            <p className="text-xs text-charcoal-500 leading-relaxed">
              Your message will be delivered to {professionalName}'s inbox. They can
              respond from their messages page.
            </p>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSend()}
                loading={sending}
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Send message
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
