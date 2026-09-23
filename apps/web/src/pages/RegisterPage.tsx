import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { RegisterSchema, type RegisterInput } from "@forge/validation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Hammer, AlertCircle, User, Wrench, CheckCircle2, Mail } from "lucide-react";
import { UserRole } from "@forge/types";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { api } from "@/lib/api";
import { ApiClientError } from "@/lib/api";

export function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  // After successful registration, show the email verification notice
  const [registered, setRegistered] = useState<{ email: string; role: UserRole } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: UserRole.Customer },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await api.post("/auth/register", {
        ...data,
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      });
      // Show email verification notice instead of redirecting to login
      setRegistered({ email: data.email, role: data.role });
    } catch (e) {
      if (e instanceof ApiClientError) setServerError(e.message);
      else setServerError("An unexpected error occurred.");
    }
  };

  // ---------------------------------------------------------------------------
  // Post-registration success screen
  // ---------------------------------------------------------------------------
  if (registered) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Hammer className="h-8 w-8 text-copper-500" aria-hidden="true" />
            <span className="text-2xl font-bold">FORGE</span>
          </div>

          <div className="forge-card p-8 space-y-5">
            <div className="h-16 w-16 rounded-full bg-green-900/30 border border-green-700 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-green-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-charcoal-100">Check your email</h1>
              <p className="text-charcoal-400 text-sm mt-2 leading-relaxed">
                We sent a verification link to{" "}
                <span className="text-charcoal-200 font-medium">{registered.email}</span>.
                Click the link to activate your account.
              </p>
            </div>

            <div className="bg-charcoal-800 rounded-lg p-4 text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                What happens next
              </p>
              {[
                "Check your inbox (and spam folder)",
                "Click the verification link in the email",
                registered.role === UserRole.Professional
                  ? "Set up your professional profile"
                  : "Start discovering skilled professionals",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-charcoal-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" aria-hidden="true" />
                  {step}
                </div>
              ))}
            </div>

            <Link to="/login" className="forge-btn-primary w-full inline-flex justify-center">
              Go to sign in
            </Link>
          </div>

          <p className="text-xs text-charcoal-500">
            Didn't receive the email?{" "}
            <button
              className="text-copper-400 hover:text-copper-300 transition-colors"
              onClick={() => setRegistered(null)}
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Registration form
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hammer className="h-8 w-8 text-copper-500" aria-hidden="true" />
            <span className="text-2xl font-bold">FORGE</span>
          </div>
          <h1 className="text-xl font-semibold text-charcoal-100">Create your account</h1>
          <p className="text-charcoal-400 text-sm mt-1">Join thousands of skilled professionals</p>
        </div>

        <div className="forge-card p-6">
          {serverError && (
            <div
              className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-sm text-red-300"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <form
            onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
            className="space-y-5"
            noValidate
          >
            <fieldset>
              <legend className="forge-label">I want to…</legend>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                {[
                  { value: UserRole.Customer, label: "Hire professionals", icon: User },
                  { value: UserRole.Professional, label: "Offer my skills", icon: Wrench },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("role", value as UserRole.Customer | UserRole.Professional)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all duration-150",
                      selectedRole === value
                        ? "border-copper-500 bg-copper-900/20 text-charcoal-50"
                        : "border-charcoal-700 bg-charcoal-800 text-charcoal-300 hover:border-charcoal-600"
                    )}
                    aria-pressed={selectedRole === value}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="text-sm text-red-400 mt-1.5" role="alert">{errors.role.message}</p>
              )}
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <Input {...register("firstName")} label="First name" autoComplete="given-name" required error={errors.firstName?.message} />
              <Input {...register("lastName")} label="Last name" autoComplete="family-name" required error={errors.lastName?.message} />
            </div>
            <Input {...register("email")} label="Email address" type="email" autoComplete="email" required error={errors.email?.message} />
            <Input {...register("password")} label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters with uppercase, lowercase, and a number" error={errors.password?.message} />
            <Input {...register("confirmPassword")} label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} />
            <input type="hidden" {...register("turnstileToken")} value="XXXX.DUMMY.TOKEN.XXXX" />

            <p className="text-xs text-charcoal-500 leading-relaxed">
              By creating an account you agree to our{" "}
              <Link to="/terms" className="text-copper-400 hover:text-copper-300">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-copper-400 hover:text-copper-300">Privacy Policy</Link>.
            </p>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-charcoal-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-copper-400 hover:text-copper-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
