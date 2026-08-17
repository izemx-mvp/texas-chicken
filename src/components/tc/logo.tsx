import { cn } from "@/lib/utils";
import texasLogo from "@/assets/texas-chicken-logo.svg";
import churchsLogo from "@/assets/churchs-logo.svg";

/** Halo/contraste appliqué en dark mode pour garder le logo officiel lisible. */
const LOGO_GLOW =
  "dark:[filter:drop-shadow(0_0_10px_oklch(0.86_0.17_82_/_45%))_drop-shadow(0_0_2px_oklch(0.98_0_0_/_85%))]";

export function TCMark({ className }: { className?: string }) {
  return (
    <img
      src={texasLogo}
      alt="Texas Chicken"
      className={cn("h-9 w-9 object-contain", LOGO_GLOW, className)}
      loading="lazy"
    />
  );
}

export function ChurchsMark({ className }: { className?: string }) {
  return (
    <img
      src={churchsLogo}
      alt="Church's Chicken"
      className={cn("h-9 w-9 object-contain", LOGO_GLOW, className)}
      loading="lazy"
    />
  );
}

/**
 * Le logo officiel contient déjà le wordmark « Texas Chicken » :
 * aucun texte additionnel n'est affiché pour éviter la redondance.
 */
export function TCLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={texasLogo}
        alt="Texas Chicken — Operational Excellence"
        className={cn("object-contain", LOGO_GLOW, compact ? "h-9 w-auto" : "h-11 w-auto")}
      />
    </div>
  );
}
