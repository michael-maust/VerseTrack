import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ProgressBar({
  percentage,
  className,
  size = "md",
  showLabel = true,
}: ProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-white/[0.08]",
          size === "md" ? "h-3" : "h-2"
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedPct}%`,
            background:
              clampedPct > 0
                ? "linear-gradient(90deg, #f59e0b 0%, #22c55e 100%)"
                : "transparent",
            boxShadow:
              clampedPct > 0
                ? "0 0 12px rgba(34, 197, 94, 0.2), 0 0 4px rgba(245, 158, 11, 0.15)"
                : "none",
          }}
        />
      </div>
      {showLabel && (
        <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
          {clampedPct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
