import { Link, useRouterState } from "@tanstack/react-router";
import { Hammer, Search, ArrowRight, Home } from "lucide-react";

export function NotFoundPage() {
  const router = useRouterState();
  const path = router.location.pathname;

  // Suggest relevant links based on what the user was trying to reach
  const suggestions = [
    { to: "/discover", label: "Find professionals", icon: Search, description: "Search skilled tradespeople and makers" },
    { to: "/", label: "Go home", icon: Home, description: "Back to the FORGE homepage" },
    { to: "/register", label: "Join FORGE", icon: ArrowRight, description: "Create your professional profile" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">

        {/* Visual */}
        <div className="text-center mb-12">
          {/* Stylised 404 with the FORGE hammer motif */}
          <div className="relative inline-block mb-6">
            <p className="text-[9rem] font-black text-charcoal-800 leading-none select-none tracking-tighter">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-2xl bg-charcoal-950 border-2 border-charcoal-700 flex items-center justify-center shadow-card">
                <Hammer className="h-10 w-10 text-copper-500" aria-hidden="true" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-charcoal-50 mb-3">
            This page doesn't exist
          </h1>
          <p className="text-charcoal-400 max-w-sm mx-auto leading-relaxed">
            The page{" "}
            <code className="text-xs bg-charcoal-800 text-copper-300 px-1.5 py-0.5 rounded font-mono">
              {path}
            </code>{" "}
            couldn't be found. It may have moved, been removed, or you may have followed a broken link.
          </p>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-500 text-center mb-4">
            Try one of these instead
          </p>
          {suggestions.map(({ to, label, icon: Icon, description }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 forge-card p-4 hover:border-charcoal-700 hover:shadow-card-hover transition-all duration-150 group"
            >
              <div className="h-10 w-10 rounded-lg bg-charcoal-800 border border-charcoal-700 flex items-center justify-center shrink-0 group-hover:border-copper-700 transition-colors">
                <Icon className="h-5 w-5 text-charcoal-400 group-hover:text-copper-400 transition-colors" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal-100 group-hover:text-copper-300 transition-colors">
                  {label}
                </p>
                <p className="text-sm text-charcoal-500">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-charcoal-600 group-hover:text-copper-500 group-hover:translate-x-1 transition-all shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-charcoal-600 mt-8">
          If you followed a link from somewhere, it may be outdated.
        </p>
      </div>
    </div>
  );
}
