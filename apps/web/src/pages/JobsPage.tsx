/**
 * Jobs page — Phase 2 feature placeholder.
 * Shows the concept of the job board and what's coming.
 */
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Search, Star, CheckCircle2, ArrowRight } from "lucide-react";

export function JobsPage() {
  const { isAuthenticated } = useAuth();

  const steps = [
    { icon: Search, title: "Post a job", description: "Describe what you need — carpentry, electrical, plumbing, custom work, anything." },
    { icon: Star, title: "Receive quotes", description: "Verified professionals in your area review your job and send you quotes." },
    { icon: CheckCircle2, title: "Hire and review", description: "Choose the right professional, complete the job, and leave a verified review." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-charcoal-800 rounded-2xl flex items-center justify-center mx-auto">
          <Briefcase className="h-8 w-8 text-copper-500" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-charcoal-50">Job Board</h1>
        <p className="text-charcoal-400 max-w-xl mx-auto leading-relaxed">
          Post a job, get quotes from skilled professionals, and hire with confidence.
          The The Guild job board is launching soon.
        </p>
        {!isAuthenticated && (
          <div className="flex gap-3 justify-center">
            <Link to="/register" className="guild-btn-primary inline-flex">
              Join The Guild
            </Link>
            <Link to="/discover" className="guild-btn-secondary inline-flex">
              Browse professionals
            </Link>
          </div>
        )}
        {isAuthenticated && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-copper-900/30 border border-copper-700 rounded-lg text-sm text-copper-300">
            <span className="h-2 w-2 rounded-full bg-copper-400 animate-pulse" />
            Coming soon — you'll be notified when jobs launch
          </div>
        )}
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal-100 mb-6 text-center">How it will work</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="guild-card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-copper-900/50 border border-copper-700 text-copper-400 text-sm flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-copper-500" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-charcoal-100">{title}</h3>
              <p className="text-sm text-charcoal-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency note */}
      <div className="guild-card p-6 space-y-3">
        <h2 className="font-semibold text-charcoal-100">Transparent by design</h2>
        <p className="text-sm text-charcoal-400 leading-relaxed">
          When you receive quotes on The Guild, you'll see the professional's full track record —
          verified jobs, customer reviews, ratings, and credentials. The Guild never secretly
          decides who is "best." You see the evidence and make the call.
        </p>
        <Link to="/discover" className="guild-btn-ghost text-sm inline-flex">
          Browse professionals now
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
