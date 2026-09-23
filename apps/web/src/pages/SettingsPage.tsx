import { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ChangePasswordSchema, type ChangePasswordInput } from "@forge/validation";
import { Shield, Lock, Trash2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

type Section = "account" | "security" | "danger";

export function SettingsPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("account");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) void navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordInput) => {
    setPwError("");
    setPwSuccess(false);
    try {
      await api.post("/auth/change-password", data);
      setPwSuccess(true);
      reset();
      // Logout since all sessions are invalidated
      setTimeout(() => void logout(), 2000);
    } catch (e) {
      setPwError(e instanceof ApiClientError ? e.message : "Failed to change password.");
    }
  };

  if (isLoading || !user) {
    return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  }

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: Shield },
    { id: "security", label: "Security", icon: Lock },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="forge-btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold text-charcoal-50">Settings</h1>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-44 shrink-0 space-y-1" aria-label="Settings navigation">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                section === id
                  ? "bg-charcoal-800 text-charcoal-50"
                  : "text-charcoal-400 hover:bg-charcoal-800 hover:text-charcoal-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Account */}
          {section === "account" && (
            <div className="forge-card p-6 space-y-4">
              <h2 className="font-semibold text-charcoal-100">Account Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-charcoal-800">
                  <span className="text-charcoal-400">Email</span>
                  <span className="text-charcoal-200">{user.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-charcoal-800">
                  <span className="text-charcoal-400">Role</span>
                  <span className="text-charcoal-200 capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-charcoal-400">Email verified</span>
                  <span className={user.emailVerified ? "text-green-400" : "text-amber-400"}>
                    {user.emailVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
              </div>
              {!user.emailVerified && (
                <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 text-sm text-amber-300">
                  Your email is not verified. Check your inbox for a verification link.
                </div>
              )}
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div className="forge-card p-6 space-y-5">
              <h2 className="font-semibold text-charcoal-100">Change Password</h2>
              {pwSuccess && (
                <div className="flex items-center gap-3 bg-green-900/30 border border-green-800 rounded-lg p-4 text-sm text-green-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Password changed. Signing you out…
                </div>
              )}
              {pwError && (
                <div className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {pwError}
                </div>
              )}
              <form onSubmit={(e) => { void handleSubmit(onChangePassword)(e); }} className="space-y-4" noValidate>
                <Input
                  {...register("currentPassword")}
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  required
                  error={errors.currentPassword?.message}
                />
                <Input
                  {...register("newPassword")}
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  required
                  hint="At least 8 characters with uppercase, lowercase, and a number"
                  error={errors.newPassword?.message}
                />
                <Input
                  {...register("confirmNewPassword")}
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  required
                  error={errors.confirmNewPassword?.message}
                />
                <Button type="submit" loading={isSubmitting}>
                  Update password
                </Button>
              </form>
              <p className="text-xs text-charcoal-500">
                Changing your password signs you out of all devices.
              </p>
            </div>
          )}

          {/* Danger zone */}
          {section === "danger" && (
            <div className="forge-card p-6 space-y-5 border-red-900">
              <h2 className="font-semibold text-red-400">Danger Zone</h2>
              <div className="space-y-4 text-sm text-charcoal-400">
                <p>
                  Deleting your account removes your login access. However, your professional
                  history — reviews you received, verified jobs, and dispute records — may be
                  retained in anonymised form to preserve platform integrity.
                </p>
                <p>
                  This action cannot be undone. If you want to take a break, consider setting
                  your availability to "Not Currently Available" instead.
                </p>
              </div>
              <div className="space-y-3">
                <label className="forge-label">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="forge-input"
                  placeholder="DELETE"
                />
                <Button
                  variant="danger"
                  disabled={deleteConfirm !== "DELETE"}
                  onClick={() => {
                    // Account deletion requires a support request in Phase 1
                    alert("Account deletion requests are handled by support. Please email support@forge.example.com.");
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete my account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
