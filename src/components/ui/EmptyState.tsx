import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: "default" | "warning" | "info";
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  const borderClass =
    variant === "warning"
      ? "border-amber-500/20"
      : variant === "info"
        ? "border-violet-500/20"
        : "border-white/10";

  return (
    <div
      className={`mx-auto max-w-lg px-4 py-16 text-center rounded-2xl border ${borderClass} bg-white/[0.02]`}
    >
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <p className="text-zinc-400 mb-6 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
