import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StarfieldBackground from "@/components/StarfieldBackground";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Avoid a "black screen" during initial auth hydration.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <StarfieldBackground />
        <div className="w-12 h-12 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ mode: "signin", from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}

