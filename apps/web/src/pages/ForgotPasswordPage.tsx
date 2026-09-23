import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Shield, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft, Home, Search } from "lucide-react";

const Schema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});
type FormData = z.infer<typeof Schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await api.post("/auth/password-reset/request", {
        email: data.email,
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      });
      setSent(true);
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
            <Shield className="h-8 w-8 text-copper-500" aria-hidden="true" />
            <span className="text-2xl font-bold">The Guild</span>
          </div>
          <h1 className="text-xl font-semibold text-charcoal-100">Reset your password</h1>
          <p className="text-charcoal-400 text-sm mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="guild-card p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
            <h2 className="text-lg font-semibold text-charcoal-100">Check your email</h2>
            <p className="text-charcoal-400 text-sm">
              If an account exists for that email, a reset link has been sent. Check your inbox
              and spam folder.
            </p>
            <Link to="/login" className="guild-btn-primary inline-flex">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="guild-card p-6">
            {serverError && (
              <div className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-sm text-red-300" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {serverError}
              </div>
            )}
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-5" noValidate>
              <Input
                {...register("email")}
                label="Email address"
                type="email"
                autoComplete="email"
                required
                error={errors.email?.message}
              />
              <Button type="submit" loading={isSubmitting} className="w-full">
                Send reset link
              </Button>
            </form>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-copper-400 hover:text-copper-300 transition-colors">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
