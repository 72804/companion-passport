"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export function LoginForm() {
  const router = useRouter();
  const { signIn, supabaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    track(ANALYTICS_EVENTS.LOGIN_COMPLETED);
    router.push("/chat");
  };

  if (!supabaseReady) {
    return (
      <Card>
        <CardTitle>Supabase not configured</CardTitle>
        <CardDescription className="mt-2">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use
          cloud accounts. The app works in local demo mode without them.
        </CardDescription>
        <Link href="/" className="inline-block mt-4">
          <Button variant="secondary">Back home</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card glow>
      <CardTitle>Log in</CardTitle>
      <CardDescription className="mb-6">Access your cloud Companion Passport.</CardDescription>
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
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="text-sm text-zinc-500 mt-4 text-center">
        No account?{" "}
        <Link href="/signup" className="text-violet-400 hover:text-violet-300">
          Sign up
        </Link>
      </p>
    </Card>
  );
}
