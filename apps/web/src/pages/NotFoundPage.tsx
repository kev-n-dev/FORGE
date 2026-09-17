import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <Hammer className="h-16 w-16 text-charcoal-700 mx-auto" aria-hidden="true" />
        <div>
          <h1 className="text-6xl font-bold text-charcoal-700">404</h1>
          <h2 className="text-2xl font-semibold text-charcoal-100 mt-2">Page not found</h2>
          <p className="text-charcoal-400 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="forge-btn-primary">Go home</Link>
          <Link to="/discover" className="forge-btn-secondary">Find professionals</Link>
        </div>
      </div>
    </div>
  );
}
