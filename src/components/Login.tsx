"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL, AUTH_TOKEN } from "@/lib/constants";
import { Driver, Rider, UserType } from "@/lib/types";
import { fetchWithAuth } from "@/lib/contracts/http";

interface LoginProps {
  userType: UserType;
  sessionExpired?: boolean;
  onSuccess: (profile: Driver | Rider) => void;
  onBack?: () => void;
}

export function Login({
  userType,
  sessionExpired,
  onSuccess,
  onBack,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": userType,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const loginBody = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(
          loginBody?.message ?? loginBody?.error ?? "Login failed",
        );
      }

      const token: string = loginBody.data.token;
      localStorage.setItem(AUTH_TOKEN, token);

      const profileRes = await fetchWithAuth(
        `${API_URL}/user/profile`,
        userType,
      );
      const profileBody = await profileRes.json();

      if (!profileRes.ok) {
        throw new Error(
          profileBody?.message ??
            profileBody?.error ??
            "Failed to fetch profile",
        );
      }

      onSuccess(profileBody.data.user as Driver | Rider);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 px-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {userType === "driver" ? "Driver Login" : "Rider Login"}
        </h2>
        <p className="text-gray-600 mb-6">Enter your credentials to continue</p>

        {sessionExpired && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Your session has expired. Please log in again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </Button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              ← Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
