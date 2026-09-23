/**
 * Profile edit page — professionals update their profile details.
 * Sections: basic info, availability, skills, services, social links.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { ProfessionalAvailability, UserRole } from "@forge/types";
import type { ProfessionalProfile } from "@forge/types";
import { UpdateProfessionalProfileSchema, type UpdateProfessionalProfileInput, AddSkillSchema } from "@forge/validation";
import { ArrowLeft, CheckCircle2, AlertCircle, Plus, X, Upload } from "lucide-react";
import { cn } from "@/lib/cn";

const AVAILABILITY_OPTIONS: { value: ProfessionalAvailability; label: string }[] = [
  { value: ProfessionalAvailability.AcceptingWork, label: "Accepting Work" },
  { value: ProfessionalAvailability.LimitedAvailability, label: "Limited Availability" },
  { value: ProfessionalAvailability.NotAvailable, label: "Not Currently Available" },
  { value: ProfessionalAvailability.AcceptingOrders, label: "Accepting Orders" },
  { value: ProfessionalAvailability.CustomWorkOnly, label: "Custom Work Only" },
  { value: ProfessionalAvailability.Mentorship, label: "Available for Mentorship" },
];

export function ProfileEditPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [activeSection, setActiveSection] = useState<"basic" | "skills" | "avatar">("basic");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== UserRole.Professional)) {
      void navigate({ to: "/dashboard" });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<ProfessionalProfile>("/profiles/me"),
    enabled: isAuthenticated && user?.role === UserRole.Professional,
  });

  const { data: skills, refetch: refetchSkills } = useQuery({
    queryKey: ["my-skills"],
    queryFn: () => api.get<Array<{ id: string; name: string; years_experience: number | null; featured: number }>>(`/profiles/${profile?.profileSlug}/skills`),
    enabled: !!profile,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateProfessionalProfileInput>({
    resolver: zodResolver(UpdateProfessionalProfileSchema),
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        businessName: profile.businessName ?? undefined,
        tagline: profile.tagline ?? undefined,
        bio: profile.bio ?? undefined,
        locationCountry: profile.location?.countryCode ?? "TT",
        locationRegion: profile.location?.region ?? undefined,
        locationCity: profile.location?.city ?? undefined,
        serviceAreaDescription: profile.location?.serviceAreaDescription ?? undefined,
        availability: profile.availability,
        availableForMentorship: profile.availableForMentorship,
        yearsExperience: profile.yearsExperience ?? undefined,
        websiteUrl: profile.websiteUrl ?? undefined,
        isPublic: profile.isPublic,
      });
    }
  }, [profile, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: UpdateProfessionalProfileInput) => api.put("/profiles/me", data),
    onSuccess: () => {
      setSaveSuccess(true);
      setServerError("");
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (e) => {
      setServerError(e instanceof ApiClientError ? e.message : "Failed to save. Please try again.");
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: (name: string) => api.post("/profiles/me/skills", { name, featured: false }),
    onSuccess: () => { void refetchSkills(); setNewSkill(""); },
  });

  const removeSkillMutation = useMutation({
    mutationFn: (skillId: string) => api.delete(`/profiles/me/skills/${skillId}`),
    onSuccess: () => void refetchSkills(),
  });

  const handleAddSkill = () => {
    const s = newSkill.trim();
    if (s) addSkillMutation.mutate(s);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      await api.put("/profiles/me/avatar/upload", file, {
        headers: { "Content-Type": file.type },
        body: file,
      });
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    } catch {
      setServerError("Failed to upload avatar.");
    }
  };

  if (authLoading || profileLoading) {
    return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-charcoal-400">Profile not found.</p>
        <Link to="/profile/setup" className="forge-btn-primary inline-flex">Set up profile</Link>
      </div>
    );
  }

  const sections = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "skills" as const, label: "Skills" },
    { id: "avatar" as const, label: "Photo" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="forge-btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-50">Edit Profile</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">
            Changes are visible to customers immediately after saving.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/people/$slug"
            params={{ slug: profile.profileSlug }}
            className="forge-btn-ghost text-sm"
          >
            View public profile
          </Link>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 bg-charcoal-900 p-1 rounded-lg w-fit">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeSection === s.id
                ? "bg-charcoal-700 text-charcoal-50"
                : "text-charcoal-400 hover:text-charcoal-200"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-green-900/30 border border-green-800 rounded-lg p-4 mb-6 text-sm text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Profile saved successfully.
        </div>
      )}
      {serverError && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-sm text-red-300" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Basic Info section */}
      {activeSection === "basic" && (
        <form
          onSubmit={(e) => { void handleSubmit((data) => saveMutation.mutate(data))(e); }}
          className="space-y-6"
        >
          <div className="forge-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-charcoal-100">Basic Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input {...register("displayName")} label="Display name" required error={errors.displayName?.message} />
              <Input {...register("businessName")} label="Business name (optional)" error={errors.businessName?.message} />
            </div>
            <Input {...register("tagline")} label="Tagline" placeholder="e.g. Carpenter · Furniture Maker" error={errors.tagline?.message} />
            <div>
              <label className="forge-label">About</label>
              <textarea
                {...register("bio")}
                rows={5}
                placeholder="Describe your experience, specialties, and what makes your work unique…"
                className="forge-input resize-none"
              />
              {errors.bio && <p className="text-sm text-red-400 mt-1">{errors.bio.message}</p>}
            </div>
            <Input {...register("yearsExperience")} label="Years of experience" type="number" min={0} max={60} error={errors.yearsExperience?.message} />
            <Input {...register("websiteUrl")} label="Website URL (optional)" type="url" placeholder="https://" error={errors.websiteUrl?.message} />
          </div>

          <div className="forge-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-charcoal-100">Location</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input {...register("locationCountry")} label="Country code" placeholder="TT" error={errors.locationCountry?.message} />
              <Input {...register("locationRegion")} label="Region" placeholder="North-West" error={errors.locationRegion?.message} />
              <Input {...register("locationCity")} label="City" placeholder="Port of Spain" error={errors.locationCity?.message} />
            </div>
            <Input {...register("serviceAreaDescription")} label="Service area description" placeholder="e.g. Port of Spain, Maraval, Diego Martin" error={errors.serviceAreaDescription?.message} />
          </div>

          <div className="forge-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-charcoal-100">Availability</h2>
            <div>
              <label className="forge-label">Current availability</label>
              <select
                {...register("availability")}
                className="forge-input mt-1.5"
              >
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="mentorship"
                {...register("availableForMentorship")}
                className="h-4 w-4 rounded border-charcoal-600 bg-charcoal-800 text-copper-500 focus:ring-copper-500"
              />
              <label htmlFor="mentorship" className="text-sm text-charcoal-300">
                Available for mentorship
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                {...register("isPublic")}
                className="h-4 w-4 rounded border-charcoal-600 bg-charcoal-800 text-copper-500 focus:ring-copper-500"
              />
              <label htmlFor="isPublic" className="text-sm text-charcoal-300">
                Profile is publicly visible
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/dashboard" className="forge-btn-secondary">Cancel</Link>
            <Button
              type="submit"
              loading={saveMutation.isPending}
              disabled={!isDirty && !saveMutation.isPending}
            >
              Save changes
            </Button>
          </div>
        </form>
      )}

      {/* Skills section */}
      {activeSection === "skills" && (
        <div className="forge-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-charcoal-100">Skills</h2>
          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); }}}
              placeholder="Add a skill…"
              className="forge-input flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddSkill}
              loading={addSkillMutation.isPending}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add
            </Button>
          </div>
          {skills && skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-800 border border-charcoal-700 rounded-lg text-sm text-charcoal-200"
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => removeSkillMutation.mutate(skill.id)}
                    className="text-charcoal-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-charcoal-500">No skills added yet.</p>
          )}
        </div>
      )}

      {/* Avatar section */}
      {activeSection === "avatar" && (
        <div className="forge-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-charcoal-100">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" />
            <div className="space-y-3">
              <p className="text-sm text-charcoal-400">
                JPG, PNG or WebP. Max 5MB. Square images work best.
              </p>
              <label className="forge-btn-secondary text-sm cursor-pointer inline-flex items-center gap-2">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => void handleAvatarUpload(e)}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
