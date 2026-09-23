import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Heart, Search, ArrowRight } from "lucide-react";

export function SavedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) void navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="h-16 w-16 bg-charcoal-800 rounded-2xl flex items-center justify-center mx-auto">
        <Heart className="h-8 w-8 text-copper-500" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-charcoal-50">Saved Professionals</h1>
        <p className="text-charcoal-400 mt-2 leading-relaxed">
          Save professionals you're interested in to easily find them later.
          This feature is coming soon.
        </p>
      </div>
      <Link to="/discover" className="forge-btn-primary inline-flex">
        <Search className="h-4 w-4" aria-hidden="true" />
        Find professionals
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
