"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = login(email, password);
    if (result.ok) {
      router.push("/calendar");
    } else {
      setError(result.error || "Login failed.");
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Welcome back</h1>
        <p className="sub">Sign in to review your event posts.</p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button className="btn primary" type="submit" style={{ width: "100%" }}>
            Sign in
          </button>
        </form>

        <div className="demo-hint">
          <strong>Demo login</strong>
          <br />
          Email: {DEMO_EMAIL}
          <br />
          Password: {DEMO_PASSWORD}
        </div>
      </div>
    </div>
  );
}
