import { cn } from "@/lib/utils";

export function TCMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="tcg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.23 28)" />
          <stop offset="60%" stopColor="oklch(0.72 0.2 45)" />
          <stop offset="100%" stopColor="oklch(0.86 0.17 82)" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 6 14v20c0 13.2 10.6 23.4 26 27 15.4-3.6 26-13.8 26-27V14L32 3Z"
        fill="url(#tcg)"
      />
      <path
        d="M32 8.5 11 17.4v16.4c0 10.6 8.4 18.9 21 22 12.6-3.1 21-11.4 21-22V17.4L32 8.5Z"
        fill="oklch(0.16 0.017 45)"
        opacity="0.86"
      />
      <path
        d="M20 23h24v6h-8.7v19h-6.6V29H20v-6Z"
        fill="url(#tcg)"
      />
    </svg>
  );
}

export function TCLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TCMark />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-lg font-bold uppercase tracking-[0.18em] text-foreground">
            Texas Chicken
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold">
            Operational Excellence
          </div>
        </div>
      )}
    </div>
  );
}
