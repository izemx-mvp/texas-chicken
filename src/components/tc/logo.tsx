import { cn } from "@/lib/utils";
import texasLogo from "@/assets/texas-chicken-logo.svg";
import churchsLogo from "@/assets/churchs-logo.svg";

export function TCMark({ className }: { className?: string }) {
  return (
    <img
      src={texasLogo}
      alt="Texas Chicken"
      className={cn("h-9 w-9 object-contain", className)}
      loading="lazy"
    />
  );
}

export function ChurchsMark({ className }: { className?: string }) {
  return (
    <img
      src={churchsLogo}
      alt="Church's Chicken"
      className={cn("h-9 w-9 object-contain", className)}
      loading="lazy"
    />
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
      <img
        src={texasLogo}
        alt="Texas Chicken"
        className={cn("object-contain", compact ? "h-9 w-9" : "h-12 w-12")}
      />
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
