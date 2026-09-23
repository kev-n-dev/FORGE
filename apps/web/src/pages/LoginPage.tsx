import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { LoginSchema, type LoginInput } from "@guild/validation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Shield, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ApiClientError } from "@/lib/api";
import { UserRole } from "@guild/types";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const user = await login(data.email, data.password, "XXXX.DUMMY.TOKEN.XXXX");

      // If there's a redirect param, honour it
      if (search.redirect) {
        await navigate({ to: search.redirect });
        return;
      }

      // Role-based redirect
      if (user.role === UserRole.Professional) {
        // Check if they have a profile set up yet
        try {
          await api.get("/profiles/me");
          await navigate({ to: "/dashboard" });
        } catch {
          // No profile yet — send to setup
          await navigate({ to: "/profile/setup" });
        }
      } else if (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin) {
        await navigate({ to: "/admin" });
      } else {
        await navigate({ to: "/dashboard" });
      }
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-copper-500" aria-hidden="true" />
            <span className="text-2xl font-bold">The Guild</span>
          </div>
          <h1 className="text-xl font-semibold text-charcoal-100">Welcome back</h1>
          <p className="text-charcoal-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="guild-card p-6">
          {serverError && (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-sm text-red-300" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-5" noValidate>
            <Input {...register("email")} label="Email address" type="email" autoComplete="email" required error={errors.email?.message} />
            <Input {...register("password")} label="Password" type="password" autoComplete="current-password" required error={errors.password?.message} />
            <input type="hidden" {...register("turnstileToken")} value="XXXX.DUMMY.TOKEN.XXXX" />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-copper-400 hover:text-copper-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-charcoal-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-copper-400 hover:text-copper-300 font-medium transition-colors">
            Join The Guild
          </Link>
        </p>
      </div>
    </div>
  );
}
