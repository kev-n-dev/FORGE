import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { Hammer, Search, Briefcase, MessageSquare, User, Menu, X, Shield } from "lucide-react";
import { Hammer, Search, Briefcase, MessageSquare, User, Menu, X, Shield } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { cn } from "@/lib/cn";
import { UserRole } from "@forge/types";

export function RootLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const routerState = useRouterState();

  if (isLoading) return <FullPageSpinner />;

  const navLinks = [
    { to: "/discover", label: "Discover", icon: Search },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
  ];

  const authLinks = isAuthenticated
    ? [
        { to: "/messages", label: "Messages", icon: MessageSquare },
        { to: "/dashboard", label: "Dashboard", icon: User },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-copper-600 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-charcoal-950/80 backdrop-blur-md border-b border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight text-charcoal-50 hover:text-copper-400 transition-colors"
              aria-label="FORGE home"
            >
              <Hammer className="h-6 w-6 text-copper-500" aria-hidden="true" />
              FORGE
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {[...navLinks, ...authLinks].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    routerState.location.pathname === to
                      ? "bg-charcoal-800 text-charcoal-50"
                      : "text-charcoal-400 hover:text-charcoal-50 hover:bg-charcoal-800"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}

              {user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-charcoal-400 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors"
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Admin
                </Link>
              ) : null}
            </nav>

            {/* Auth area */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <Link to="/settings">
                    <Avatar src={null} name={user.email} size="sm" />
                  </Link>
                  <Link to="/settings" className="text-sm text-charcoal-400 hover:text-charcoal-50 transition-colors">
                    {user.email.split("@")[0]}
                  </Link>
                  <button
                    onClick={() => void logout()}
                    className="text-sm text-charcoal-400 hover:text-charcoal-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-charcoal-300 hover:text-charcoal-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="forge-btn-primary text-sm px-4 py-2"
                  >
                    Join FORGE
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-charcoal-400 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen
                ? <X className="h-6 w-6" aria-hidden="true" />
                : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-charcoal-800 bg-charcoal-950 animate-slide-up">
            <nav className="px-4 py-4 space-y-1" aria-label="Mobile navigation">
              {[...navLinks, ...authLinks].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal-300 hover:bg-charcoal-800 hover:text-charcoal-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-charcoal-800 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full forge-btn-secondary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full forge-btn-primary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Join FORGE
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-charcoal-800 bg-charcoal-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold text-charcoal-400">
              <Hammer className="h-5 w-5 text-copper-600" aria-hidden="true" />
              FORGE
            </div>
            <p className="text-sm text-charcoal-500 text-center">
              Platform levels and verification badges describe activity on FORGE and are not official
              trade qualifications. FORGE does not guarantee the quality or conduct of any
              professional.
            </p>
            <nav className="flex gap-4 text-sm text-charcoal-500" aria-label="Footer navigation">
              <Link to="/safety" className="hover:text-charcoal-300 transition-colors">Safety Center</Link>
              <Link to="/privacy" className="hover:text-charcoal-300 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-charcoal-300 transition-colors">Terms</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
