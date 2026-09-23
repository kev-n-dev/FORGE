/**
 * Messages page — Phase 1 placeholder.
 * Messaging is a Phase 2 feature. This page explains that and shows
 * how to contact professionals in the meantime.
 */
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { MessageSquare, Search, ArrowRight } from "lucide-react";

export function MessagesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="h-16 w-16 bg-charcoal-800 rounded-2xl flex items-center justify-center mx-auto">
        <MessageSquare className="h-8 w-8 text-copper-500" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-charcoal-50">Messages</h1>
        <p className="text-charcoal-400 mt-2 leading-relaxed">
          In-platform messaging is coming soon. For now, you can contact professionals
          directly through their profile page.
        </p>
      </div>

      <div className="forge-card p-6 text-left space-y-4">
        <h2 className="font-semibold text-charcoal-100">How to contact a professional</h2>
        <ol className="space-y-3 text-sm text-charcoal-300">
          {[
            "Search for a professional using the Discover page",
            "Open their profile",
            'Click the "Contact" button',
            "Messaging will open here once it launches",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-copper-900/50 border border-copper-700 text-copper-400 text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <Link to="/discover" className="forge-btn-primary inline-flex">
        <Search className="h-4 w-4" aria-hidden="true" />
        Find professionals
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
