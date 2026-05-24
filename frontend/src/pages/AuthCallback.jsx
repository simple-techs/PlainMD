import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, setToken } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const redirect_uri = window.location.origin + "/auth/callback";
        const { data } = await api.post("/auth/google/callback", { code, redirect_uri });
        if (data?.session_token) setToken(data.session_token);
        const u = await refresh();
        toast.success(`Welcome${u?.name ? `, ${u.name}` : ""}!`);
        navigate("/app/home", { replace: true });
      } catch (e) {
        toast.error("Google sign-in failed. Please try again.");
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, refresh, searchParams]);

  return (
    <div className="min-h-screen bg-brand-soft-gray flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
