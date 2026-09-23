/**
 * Simple static content pages — Safety Center, Privacy, Terms.
 * Content is placeholder for Phase 1. Replace with real content before launch.
 */
import { useParams } from "@tanstack/react-router";
import { Shield, Lock, FileText } from "lucide-react";

interface StaticPageConfig {
  title: string;
  icon: React.ElementType;
  sections: { heading: string; body: string }[];
}

const PAGES: Record<string, StaticPageConfig> = {
  safety: {
    title: "Safety Center",
    icon: Shield,
    sections: [
      {
        heading: "Avoiding scams",
        body: "Never pay a deposit outside of an agreed quote. Be wary of professionals who ask for full payment upfront before any work begins. Use The Guild messaging to keep a record of all communications.",
      },
      {
        heading: "Understanding verification",
        body: "Verification badges show what was checked — identity, business registration, or credentials. Verification confirms the information provided but does not guarantee the quality of work or professional conduct.",
      },
      {
        heading: "Safe communication",
        body: "Use The Guild messaging to communicate with professionals. Avoid sharing your home address until you have agreed to hire someone. Never share financial account details.",
      },
      {
        heading: "Reporting users",
        body: "If you encounter suspicious behavior, use the Report button on any profile, review, or message. Our team reviews every report. False reports may result in account action.",
      },
      {
        heading: "Dispute process",
        body: "If something goes wrong after hiring a professional, you can open a dispute through your dashboard. Provide evidence and our moderation team will investigate.",
      },
      {
        heading: "Review rules",
        body: "Reviews must be honest and relate to your actual experience. Fake reviews, paid reviews, and review exchanges violate our policies. Professionals cannot delete legitimate reviews.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: Lock,
    sections: [
      {
        heading: "What we collect",
        body: "We collect information you provide when registering (name, email), information you add to your profile (work history, skills, portfolio), and usage data to improve the platform.",
      },
      {
        heading: "How we use it",
        body: "We use your information to operate The Guild, connect customers with professionals, display your profile publicly (if you choose), and send relevant notifications.",
      },
      {
        heading: "What we don't do",
        body: "We do not sell your personal data to third parties. We do not expose your private address publicly. Verification documents are stored privately and never shown to other users.",
      },
      {
        heading: "Your controls",
        body: "You can set your profile to private, control what information is visible, update your details at any time, and request account deletion through Settings.",
      },
      {
        heading: "Data retention",
        body: "If you delete your account, we anonymise your profile data. Review records and dispute history may be retained in anonymised form for platform integrity and legal compliance.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    sections: [
      {
        heading: "Using The Guild",
        body: "The Guild is a platform that connects customers with skilled professionals. We facilitate discovery, reputation, and communication — but we are not a party to any agreement between customers and professionals.",
      },
      {
        heading: "Accurate information",
        body: "You must provide accurate information on your profile. False credentials, fake reviews, or misrepresentation may result in permanent suspension.",
      },
      {
        heading: "Reviews",
        body: "Reviews must reflect genuine experiences. Professionals may not pay for reviews, arrange review exchanges, or retaliate against customers for honest reviews.",
      },
      {
        heading: "No guarantee",
        body: "The Guild provides information and tools to help you make decisions. We do not guarantee the quality of any professional's work or conduct. Platform levels and verification badges are not endorsements.",
      },
      {
        heading: "Prohibited conduct",
        body: "You may not use The Guild to harass, defraud, or threaten other users. Spam, fake accounts, and automated scraping are prohibited.",
      },
      {
        heading: "Changes",
        body: "We may update these terms as the platform evolves. Continued use of The Guild after changes are published constitutes acceptance.",
      },
    ],
  },
};

export function StaticPage({ page }: { page: "safety" | "privacy" | "terms" }) {
  const config = PAGES[page];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-charcoal-800 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-copper-500" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-charcoal-50">{config.title}</h1>
      </div>

      <div className="space-y-6">
        {config.sections.map((section) => (
          <div key={section.heading} className="guild-card p-6 space-y-2">
            <h2 className="font-semibold text-charcoal-100">{section.heading}</h2>
            <p className="text-charcoal-400 leading-relaxed text-sm">{section.body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-charcoal-600">
        Questions? Contact us at support@theguild.example.com
      </p>
    </div>
  );
}

// Individual page exports for the router
export const SafetyCenterPage = () => <StaticPage page="safety" />;
export const PrivacyPage = () => <StaticPage page="privacy" />;
export const TermsPage = () => <StaticPage page="terms" />;
