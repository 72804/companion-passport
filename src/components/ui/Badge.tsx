import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "violet" | "emerald" | "amber";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-white/10 text-zinc-300": variant === "default",
          "bg-violet-500/20 text-violet-300": variant === "violet",
          "bg-emerald-500/20 text-emerald-300": variant === "emerald",
          "bg-amber-500/20 text-amber-300": variant === "amber",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
