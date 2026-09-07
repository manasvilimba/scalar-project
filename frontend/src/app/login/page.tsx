"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { login as apiLogin } from "@/lib/api";
import { ApiError } from "@/types/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const { token, isLoading, login } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already logged in → go to console
  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/hosted-zones");
    }
  }, [token, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const resp = await apiLogin({ username: username.trim(), password });
      login(resp.access_token, username.trim());
      addToast("success", `Welcome back, ${username.trim()}!`);
      router.replace("/hosted-zones");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--aws-bg)" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-[var(--radius-lg)] shadow-xl overflow-hidden"
        style={{
          backgroundColor: "var(--aws-surface)",
          border: "1px solid var(--aws-border)",
        }}
      >
        {/* Header strip */}
        <div
          className="px-8 py-5 flex flex-col items-center gap-2"
          style={{ backgroundColor: "var(--aws-navy)" }}
        >
          {/* AWS logo mark */}
          <img
  src="/aws-logo.png"
  alt="Amazon Web Services"
  className="w-[70px] h-auto object-contain"
/>
          <p className="text-white text-xs font-light tracking-widest uppercase opacity-70">
            Management Console
          </p>
          <h1 className="text-white text-lg font-semibold">
            Route&nbsp;53
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
          <Input
            id="login-username"
            label="IAM username"
            required
            autoComplete="username"
            placeholder="Enter IAM username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
          />
          <Input
            id="login-password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            error={error || undefined}
          />

          <Button
            id="login-submit"
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full mt-1"
          >
            Sign in
          </Button>
        </form>

        {/* Footer hint */}
        <div
          className="px-8 pb-5 text-center text-xs"
          style={{ color: "var(--aws-text-muted)" }}
        >
          Default credentials:&nbsp;
          <code className="mono font-semibold text-[var(--aws-text)]">user&nbsp;/&nbsp;user@123</code>
        </div>
      </div>
    </div>
  );
}