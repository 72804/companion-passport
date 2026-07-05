"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export function SignupForm() {
  const router = useRouter();
  const { signUp, supabaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    track(ANALYTICS_EVENTS.SIGNUP_STARTED);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    track(ANALYTICS_EVENTS.SIGNUP_COMPLETED);
    setSuccess(true);
    setTimeout(() => router.push("/chat"), 1500);
  };

  if (!supabaseReady) {
    return (
      <Card>
        <CardTitle>Supabase not configured</CardTitle>
        <CardDescription className="mt-2">
          Cloud signup requires Supabase environment variables.
        </CardDescription>
        <Link href="/" className="inline-block mt-4">
          <Button variant="secondary">Back home</Button>
        </Link>
      </Card>
    );
  }

  if (success) {
    return (
      <Card glow>
        <CardTitle>Account created</CardTitle>
        <CardDescription className="mt-2">
          Check your email if confirmation is required. Redirecting...
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card glow>
      <CardTitle>Sign up</CardTitle>
      <CardDescription className="mb-6">
        Create an account to sync your Companion Passport to the cloud.
      </CardDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-zinc-500 mt-4 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-400 hover:text-violet-300">
          Log in
        </Link>
      </p>
    </Card>
  );
}
