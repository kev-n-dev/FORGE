import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { UserRole } from "@forge/types";
import type { ProfessionalProfile } from "@forge/types";
import {
  Briefcase, Package, MessageSquare, Star, TrendingUp, Settings,
  Edit3, Eye, ShieldCheck, Heart, FileText, PlusCircle, CheckCircle2,
} from "lucide-react";
import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Professional Dashboard
// ---------------------------------------------------------------------------
function ProfessionalDashboard() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<ProfessionalProfile>("/profiles/me"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // If no profile yet, redirect to setup
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="h-14 w-14 text-copper-500 mx-auto" />
        <h1 className="text-2xl font-bold text-charcoal-50">Complete your profile</h1>
        <p className="text-charcoal-400">
          Set up your professional profile to start getting discovered.
        </p>
        <Link to="/profile/setup" className="forge-btn-primary inline-flex">
          Set up profile
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Platform Level", value: `${profile.reputation.level} — ${profile.reputation.levelName}`, icon: TrendingUp, color: "text-copper-400" },
    { label: "Reviews", value: String(profile.reviewCount), icon: Star, color: "text-amber-400" },
    { label: "Verified Jobs", value: String(profile.verifiedJobCount), icon: Briefcase, color: "text-green-400" },
    { label: "Portfolio", value: String(profile.portfolioProjectCount), icon: Package, color: "text-blue-400" },
  ];

  const isNew = profile.reviewCount === 0 && profile.verifiedJobCount === 0 && profile.portfolioProjectCount === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile header */}
      <div className="forge-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-charcoal-50">
              {profile.businessName ?? profile.displayName}
            </h1>
            {profile.tagline && (
              <p className="text-charcoal-400 mt-0.5">{profile.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {profile.averageRating !== null && (
                <StarRating rating={profile.averageRating} size="sm" />
              )}
              <Badge variant="level" icon={false}>
                Level {profile.reputation.level} — {profile.reputation.levelName}
              </Badge>
              {profile.verifications.map((v) => (
                <Badge key={v.type} variant="verified">{v.label}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to="/people/$slug"
              params={{ slug: profile.profileSlug }}
              className="forge-btn-ghost text-sm"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              View profile
            </Link>
            <Link to="/profile/edit" className="forge-btn-secondary text-sm">
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* New user getting started prompt */}
      {isNew && (
        <div className="forge-card p-6 border-copper-800 bg-copper-950/20">
          <h2 className="font-semibold text-charcoal-100 mb-1">Get started on FORGE</h2>
          <p className="text-sm text-charcoal-400 mb-4">
            Complete these steps to start getting discovered by customers.
          </p>
          <div className="space-y-3">
            {[
              { label: "Complete your profile", done: !!profile.bio, href: "/profile/edit" },
              { label: "Add your skills", done: profile.skills?.length > 0, href: "/profile/edit" },
              { label: "Add a portfolio project", done: profile.portfolioProjectCount > 0, href: "/profile/edit" },
              { label: "Set your availability", done: !!profile.availability, href: "/profile/edit" },
            ].map(({ label, done, href }) => (
              <Link
                key={label}
                to={href}
                className="flex items-center gap-3 text-sm hover:text-charcoal-100 transition-colors"
              >
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "border-green-500 bg-green-500" : "border-charcoal-600"}`}>
                  {done && <CheckCircle2 className="h-3 w-3 text-white" aria-hidden="true" />}
                </div>
                <span className={done ? "text-charcoal-500 line-through" : "text-charcoal-300"}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="forge-card p-5 space-y-2">
            <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
            <p className="text-xl font-bold text-charcoal-50">{value}</p>
            <p className="text-sm text-charcoal-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: "Add portfolio project",
            description: "Show off your recent work",
            icon: PlusCircle,
            href: "/profile/edit",
            color: "text-copper-400",
          },
          {
            title: "Messages",
            description: "Check your conversations",
            icon: MessageSquare,
            href: "/messages",
            color: "text-blue-400",
          },
          {
            title: "Reviews",
            description: "See what customers are saying",
            icon: Star,
            href: `/people/${profile.profileSlug}`,
            color: "text-amber-400",
          },
          {
            title: "Edit profile",
            description: "Update your skills and services",
            icon: Edit3,
            href: "/profile/edit",
            color: "text-charcoal-300",
          },
          {
            title: "Verification",
            description: "Get identity or business verified",
            icon: ShieldCheck,
            href: "/settings",
            color: "text-green-400",
          },
          {
            title: "Settings",
            description: "Account and privacy settings",
            icon: Settings,
            href: "/settings",
            color: "text-charcoal-400",
          },
        ].map(({ title, description, icon: Icon, href, color }) => (
          <Link
            key={href}
            to={href}
            className="forge-card p-5 flex items-start gap-4 hover:border-charcoal-700 hover:shadow-card-hover transition-all duration-150"
          >
            <div className="h-9 w-9 rounded-lg bg-charcoal-800 flex items-center justify-center shrink-0">
              <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-charcoal-100">{title}</p>
              <p className="text-sm text-charcoal-400 mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Availability */}
      <div className="forge-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-charcoal-100">Availability status</p>
          <p className="text-sm text-charcoal-400 mt-0.5">
            Currently:{" "}
            <span className="text-green-400 font-medium">
              {profile.availability.replace(/_/g, " ")}
            </span>
          </p>
        </div>
        <Link to="/profile/edit" className="forge-btn-secondary text-sm shrink-0">
          Update
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer Dashboard
// ---------------------------------------------------------------------------
function CustomerDashboard() {
  const { user } = useAuth();

  const quickLinks = [
    { title: "Find professionals", description: "Search and discover skilled people", icon: Eye, href: "/discover", color: "text-copper-400" },
    { title: "Post a job", description: "Get quotes from professionals", icon: PlusCircle, href: "/jobs/new", color: "text-blue-400" },
    { title: "My jobs", description: "Track your active jobs", icon: Briefcase, href: "/jobs", color: "text-green-400" },
    { title: "Messages", description: "Chat with professionals", icon: MessageSquare, href: "/messages", color: "text-amber-400" },
    { title: "Saved professionals", description: "Your saved list", icon: Heart, href: "/saved", color: "text-red-400" },
    { title: "Settings", description: "Account settings", icon: Settings, href: "/settings", color: "text-charcoal-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-50">Dashboard</h1>
        <p className="text-charcoal-400 mt-1">Welcome back, {user?.email}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(({ title, description, icon: Icon, href, color }) => (
          <Link
            key={href}
            to={href}
            className="forge-card p-5 flex items-start gap-4 hover:border-charcoal-700 hover:shadow-card-hover transition-all duration-150"
          >
            <div className="h-9 w-9 rounded-lg bg-charcoal-800 flex items-center justify-center shrink-0">
              <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-charcoal-100">{title}</p>
              <p className="text-sm text-charcoal-400 mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root dashboard — splits by role
// ---------------------------------------------------------------------------
export function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user.role === UserRole.Professional) return <ProfessionalDashboard />;
  return <CustomerDashboard />;
}
