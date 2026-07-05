"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create" },
  { href: "/chat", label: "Chat" },
  { href: "/passport", label: "Passport" },
  { href: "/waitlist", label: "Waitlist" },
  { href: "/settings", label: "Settings" },
];

export function Navigation() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { email, user, supabaseReady } = useAuth();
  const { dataMode } = useApp();

  return (
    <>
      {!user && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-200/90">
          Demo mode: data is saved only on this device.
          {supabaseReady && (
            <>
              {" "}
              <Link href="/signup" className="underline hover:text-amber-100">
                Create an account
              </Link>{" "}
              to sync to the cloud.
            </>
          )}
        </div>
      )}
      {user && dataMode === "local" && (
        <div className="bg-violet-500/10 border-b border-violet-500/20 px-4 py-2 text-center text-xs text-violet-200/90">
          Logged in as {email} — using local demo data on this device.
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-900/40">
              CP
            </div>
            <span className="font-semibold text-white group-hover:text-violet-200 transition-colors">
              Companion Passport
            </span>
            <Badge variant="violet" className="text-[10px] px-1.5 py-0">
              Beta
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <span className="ml-2 text-xs text-zinc-500 truncate max-w-[140px]">
                {email}
              </span>
            ) : supabaseReady ? (
              <Link
                href="/login"
                className="ml-2 rounded-lg px-3 py-2 text-sm text-violet-300 hover:bg-white/5"
              >
                Log in
              </Link>
            ) : null}
          </nav>

          {!isLanding && (
            <Link
              href="/create"
              className="md:hidden rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Create
            </Link>
          )}
        </div>

        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-hide">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                pathname === item.href
                  ? "bg-violet-600/30 text-violet-200"
                  : "bg-white/5 text-zinc-400"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
