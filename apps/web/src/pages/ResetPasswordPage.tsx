import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordResetConfirmSchema, type PasswordResetConfirmInput } from "@forge/validation";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Hammer, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export function ResetPasswordPage() {
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token;
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(PasswordResetConfirmSchema),
  });

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <XCircle className="h-14 w-14 text-charcoal-600 mx-auto" />
          <h1 className="text-xl font-semibold text-charcoal-100">Invalid reset link</h1>
          <p className="text-charcoal-400">This link is missing a token. Please request a new one.</p>
          <Link to="/forgot-password" className="forge-btn-primary inline-flex">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
          <h1 className="text-xl font-semibold text-charcoal-100">Password updated</h1>
          <p className="text-charcoal-400">You can now sign in with your new password.</p>
          <Link to="/login" className="forge-btn-primary inline-flex">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: PasswordResetConfirmInput) => {
    setServerError("");
    try {
      await api.post("/auth/password-reset/confirm", { token, password: data.password, confirmPassword: data.confirmPassword });
      setSuccess(true);
    } catch (e) {
      if (e instanceof ApiClientError) setServerError(e.message);
      else setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hammer className="h-8 w-8 text-copper-500" aria-hidden="true" />
            <span className="text-2xl font-bold">FORGE</span>
          </div>
          <h1 className="text-xl font-semibold text-charcoal-100">Choose a new password</h1>
        </div>

        <div className="forge-card p-6">
          {serverError && (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-sm text-red-300" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}
          <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-5" noValidate>
            <Input
              {...register("password")}
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              hint="At least 8 characters with uppercase, lowercase, and a number"
              error={errors.password?.message}
            />
            <Input
              {...register("confirmPassword")}
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
