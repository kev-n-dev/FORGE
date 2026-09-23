/**
 * Profile setup — shown to professional users after first registration.
 * Walks through: basic info → categories → skills → availability.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@guild/types";
import { ProfessionalAvailability } from "@guild/types";
import { z } from "zod";
import { Shield, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft, Home, Search } from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Step schemas
// ---------------------------------------------------------------------------
const Step1Schema = z.object({
  displayName: z.string().min(2).max(100).trim(),
  businessName: z.string().max(150).trim().optional(),
  tagline: z.string().max(200).trim().optional(),
  locationCountry: z.string().length(2).toUpperCase().default("TT"),
  locationCity: z.string().max(100).trim().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  bio: z.string().max(2000).trim().optional(),
});

type Step1Data = z.infer<typeof Step1Schema>;

const STEPS = ["Basic Info", "Categories", "Skills", "Done"];

export function ProfileSetupPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/search/categories"),
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { locationCountry: "TT" },
  });

  if (isLoading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  const progressPercent = ((step) / (STEPS.length - 1)) * 100;

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills((prev) => [...prev, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setServerError("");
    const values = getValues();
    try {
      // Update profile
      await api.put("/profiles/me", {
        displayName: values.displayName,
        businessName: values.businessName || null,
        tagline: values.tagline || null,
        bio: values.bio || null,
        locationCountry: values.locationCountry,
        locationCity: values.locationCity || null,
        yearsExperience: values.yearsExperience ?? null,
        availability: ProfessionalAvailability.AcceptingWork,
        availableForMentorship: false,
        isPublic: true,
      });

      // Add skills
      for (const skill of skills) {
        await api.post("/profiles/me/skills", { name: skill, featured: false });
      }

      void navigate({ to: "/dashboard" });
    } catch (e) {
      setServerError(e instanceof ApiClientError ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-8 w-8 text-copper-500" aria-hidden="true" />
            <span className="text-2xl font-bold">The Guild</span>
          </div>
          <h1 className="text-xl font-semibold text-charcoal-100">Set up your profile</h1>
          <p className="text-charcoal-400 text-sm mt-1">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-charcoal-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-copper-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {serverError && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-sm text-red-300" role="alert">
            {serverError}
          </div>
        )}

        {/* Step 0 — Basic info */}
        {step === 0 && (
          <div className="guild-card p-6 space-y-5">
            <Input {...register("displayName")} label="Your name" required placeholder="e.g. Marcus Williams" error={errors.displayName?.message} />
            <Input {...register("businessName")} label="Business name (optional)" placeholder="e.g. Marcus Woodworks" error={errors.businessName?.message} />
            <Input {...register("tagline")} label="Tagline (optional)" placeholder="e.g. Carpenter · Furniture Maker" error={errors.tagline?.message} />
            <Input {...register("bio")} label="About you (optional)" placeholder="Tell customers about your work and experience..." error={errors.bio?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Input {...register("locationCountry")} label="Country code" placeholder="TT" error={errors.locationCountry?.message} />
              <Input {...register("locationCity")} label="City" placeholder="Port of Spain" error={errors.locationCity?.message} />
            </div>
            <Input {...register("yearsExperience")} label="Years of experience (optional)" type="number" min={0} max={60} error={errors.yearsExperience?.message} />
            <Button
              className="w-full"
              onClick={() => { void handleSubmit(() => setStep(1))(); }}
            >
              Continue <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Step 1 — Categories */}
        {step === 1 && (
          <div className="guild-card p-6 space-y-5">
            <div>
              <p className="guild-label">What do you do? <span className="text-charcoal-500">(select up to 5)</span></p>
              {categories ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150",
                        selectedCategories.includes(cat.id)
                          ? "border-copper-500 bg-copper-900/30 text-charcoal-50"
                          : "border-charcoal-700 bg-charcoal-800 text-charcoal-300 hover:border-charcoal-600"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-8"><Spinner /></div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(0)}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                Continue <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Skills */}
        {step === 2 && (
          <div className="guild-card p-6 space-y-5">
            <div>
              <label className="guild-label">Your skills</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); }}}
                  placeholder="e.g. Carpentry, Cabinetry…"
                  className="guild-input flex-1"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 px-3 py-1 bg-charcoal-800 border border-charcoal-700 rounded-lg text-sm text-charcoal-200"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-charcoal-500 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-charcoal-500 mt-2">
                Press Enter or click Add. You can add more later.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
              </Button>
              <Button className="flex-1" loading={submitting} onClick={() => void handleFinish()}>
                Finish setup <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Done (redirect happens automatically) */}
        {step === 3 && (
          <div className="guild-card p-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
            <h2 className="text-xl font-semibold text-charcoal-100">Profile created!</h2>
            <p className="text-charcoal-400">Taking you to your dashboard…</p>
            <Spinner className="mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
