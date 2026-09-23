import { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { Shield, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft, Home, Search } from "lucide-react";
import { ApiClientError } from "@/lib/api";

type Status = "verifying" | "success" | "error" | "missing";

export function VerifyEmailPage() {
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token;
  const [status, setStatus] = useState<Status>(token ? "verifying" : "missing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((e) => {
        setStatus("error");
        setErrorMessage(
          e instanceof ApiClientError ? e.message : "Verification failed. Please try again."
        );
      });
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-copper-500" aria-hidden="true" />
          <span className="text-2xl font-bold">The Guild</span>
        </div>

        {status === "verifying" && (
          <>
            <Loader2 className="h-12 w-12 text-copper-500 animate-spin mx-auto" />
            <div>
              <h1 className="text-xl font-semibold text-charcoal-100">Verifying your email…</h1>
              <p className="text-charcoal-400 mt-1">Please wait a moment.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
            <div>
              <h1 className="text-xl font-semibold text-charcoal-100">Email verified!</h1>
              <p className="text-charcoal-400 mt-1">Your account is now active.</p>
            </div>
            <Link to="/login" className="guild-btn-primary inline-flex">
              Sign in to The Guild
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-14 w-14 text-red-400 mx-auto" />
            <div>
              <h1 className="text-xl font-semibold text-charcoal-100">Verification failed</h1>
              <p className="text-charcoal-400 mt-1">{errorMessage}</p>
            </div>
            <div className="space-y-3">
              <Link to="/register" className="guild-btn-primary inline-flex">
                Register again
              </Link>
              <div>
                <Link to="/login" className="text-sm text-copper-400 hover:text-copper-300">
                  Already verified? Sign in
                </Link>
              </div>
            </div>
          </>
        )}

        {status === "missing" && (
          <>
            <XCircle className="h-14 w-14 text-charcoal-600 mx-auto" />
            <div>
              <h1 className="text-xl font-semibold text-charcoal-100">Invalid link</h1>
              <p className="text-charcoal-400 mt-1">
                This verification link is missing a token. Check your email for the correct link.
              </p>
            </div>
            <Link to="/" className="guild-btn-secondary inline-flex">
              Go home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
