import { Link } from "@tanstack/react-router";
import { Search, Shield, Star, Hammer, Wrench, Layers } from "lucide-react";

export function HomePage() {
  const categories = [
    "Carpentry", "Electrical", "Plumbing", "Masonry", "Welding",
    "Mechanics", "HVAC", "Landscaping", "Painting", "Woodworking",
    "Furniture Making", "Leather Work", "Pottery", "Jewelry Making",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal-950 border-b border-charcoal-800">
        <div className="absolute inset-0 bg-gradient-to-br from-copper-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Hammer className="h-7 w-7 text-copper-500" aria-hidden="true" />
              <span className="text-copper-400 font-semibold tracking-wide uppercase text-sm">FORGE</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-charcoal-50 leading-tight mb-6">
              Build your reputation.
            </h1>
            <p className="text-xl text-charcoal-300 mb-10 max-w-xl leading-relaxed">
              The professional network for people who make, build, repair, create, and sell.
              Show your work. Get discovered. Build your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/discover" className="forge-btn-primary text-base px-8 py-4">
                <Search className="h-5 w-5" aria-hidden="true" />
                Find Professionals
              </Link>
              <Link to="/register" className="forge-btn-secondary text-base px-8 py-4">
                Join as a Professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20 border-b border-charcoal-800" aria-labelledby="value-props-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="value-props-heading" className="text-3xl font-bold text-charcoal-50 mb-12 text-center">
            Your craft. Your reputation. Your future.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Layers,
                title: "Show your work",
                description:
                  "Build a professional portfolio with before/after project photos. Let your work speak for itself.",
              },
              {
                icon: Star,
                title: "Build real reputation",
                description:
                  "Verified jobs, genuine reviews, and transparent evidence — not a black-box algorithm.",
              },
              {
                icon: Shield,
                title: "Trust through evidence",
                description:
                  "FORGE shows customers evidence and lets them decide. No secret rankings. No manipulated results.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="forge-card p-6 space-y-4">
                <div className="h-10 w-10 bg-copper-900/50 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-copper-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal-50">{title}</h3>
                <p className="text-charcoal-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20" aria-labelledby="categories-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 id="categories-heading" className="text-2xl font-bold text-charcoal-50">
              Explore trades &amp; crafts
            </h2>
            <Link to="/discover" className="text-copper-400 hover:text-copper-300 text-sm font-medium transition-colors">
              Browse all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat}
                to="/discover"
                search={{ q: cat }}
                className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 hover:border-copper-700 text-charcoal-300 hover:text-charcoal-50 rounded-lg text-sm font-medium transition-all duration-150"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-charcoal-900 border-y border-charcoal-800" aria-labelledby="how-it-works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Wrench className="h-10 w-10 text-copper-500 mx-auto mb-6" aria-hidden="true" />
          <h2 id="how-it-works" className="text-3xl font-bold text-charcoal-50 mb-4">
            For professionals who make things happen
          </h2>
          <p className="text-charcoal-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Create your profile, show your work, get hired, collect verified reviews, and build a
            public professional identity that grows with your career.
          </p>
          <Link to="/register" className="forge-btn-primary text-base px-8 py-4 inline-flex">
            Start Building Your Profile
          </Link>
        </div>
      </section>
    </div>
  );
}
