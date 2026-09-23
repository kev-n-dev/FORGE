/**
 * Contact / Request Quote modal shown from public profile pages.
 * Phase 1: routes to messages (coming soon) with a clear explanation.
 * Phase 2: will open a real conversation thread.
 */
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { X, MessageSquare, FileText, ArrowRight } from "lucide-react";

interface ContactModalProps {
  professionalName: string;
  professionalSlug: string;
  mode: "contact" | "quote";
  onClose: () => void;
}

export function ContactModal({ professionalName, professionalSlug, mode, onClose }: ContactModalProps) {
  const { isAuthenticated } = useAuth();

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
      <div className="relative forge-card w-full max-w-md p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="contact-modal-title" className="text-lg font-semibold text-charcoal-100">
              {mode === "quote" ? "Request a Quote" : "Contact Professional"}
            </h2>
            <p className="text-sm text-charcoal-400 mt-0.5">{professionalName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!isAuthenticated ? (
          // Not logged in — prompt to sign up / sign in
          <div className="space-y-4">
            <p className="text-sm text-charcoal-400 leading-relaxed">
              Create a free account to contact{" "}
              <span className="text-charcoal-200 font-medium">{professionalName}</span> and
              keep a record of your conversation.
            </p>
            <div className="space-y-2">
              <Link
                to="/register"
                className="forge-btn-primary w-full inline-flex justify-center"
                onClick={onClose}
              >
                Create free account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                search={{ redirect: `/people/${professionalSlug}` }}
                className="forge-btn-secondary w-full inline-flex justify-center"
                onClick={onClose}
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          // Logged in — messaging is Phase 2
          <div className="space-y-4">
            <div className="flex gap-3 bg-charcoal-800 rounded-lg p-4">
              {mode === "quote"
                ? <FileText className="h-5 w-5 text-copper-400 shrink-0 mt-0.5" aria-hidden="true" />
                : <MessageSquare className="h-5 w-5 text-copper-400 shrink-0 mt-0.5" aria-hidden="true" />}
              <div>
                <p className="text-sm font-medium text-charcoal-100">
                  {mode === "quote" ? "Quote requests" : "In-platform messaging"} coming soon
                </p>
                <p className="text-sm text-charcoal-400 mt-1 leading-relaxed">
                  Direct messaging is launching in the next phase. In the meantime,
                  check the professional's profile for a website or contact link.
                </p>
              </div>
            </div>

            {/* Show website link if available */}
            <div className="space-y-2">
              <Link
                to="/messages"
                className="forge-btn-primary w-full inline-flex justify-center"
                onClick={onClose}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Go to Messages
              </Link>
              <button
                onClick={onClose}
                className="forge-btn-ghost w-full text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
